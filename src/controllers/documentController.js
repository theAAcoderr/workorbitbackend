const Document = require('../models/Document');
const { User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

// Check if S3 storage should be used
const useS3Storage = process.env.USE_S3_STORAGE === 'true' &&
                     process.env.AWS_ACCESS_KEY_ID &&
                     process.env.AWS_SECRET_ACCESS_KEY;

let s3Service;
if (useS3Storage) {
  s3Service = require('../services/s3Service');
}

/**
 * Upload document
 * @route POST /api/v1/documents/upload
 * @access Private
 */
exports.uploadDocument = async (req, res) => {
  try {
    console.log('📤 Document upload request received');
    console.log('User:', req.user?.id, req.user?.email);
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      name,
      description,
      category = 'Other',
      visibility = 'private',
      tags = [],
      sharedWith = []
    } = req.body;

    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Parse tags and sharedWith if they're JSON strings
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    const parsedSharedWith = typeof sharedWith === 'string' ? JSON.parse(sharedWith) : sharedWith;

    // Get file information
    const fileName = req.file.originalname;
    const fileExtension = path.extname(fileName).substring(1).toLowerCase();
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Construct file URL based on storage type
    let fileUrl;
    let s3Key = null;

    if (useS3Storage && req.file.key) {
      // S3 storage - multer-s3 provides the key
      s3Key = req.file.key;
      fileUrl = req.file.location || s3Service.getPublicUrl(s3Key);
      console.log('📦 File uploaded to S3:', s3Key);
    } else {
      // Local storage
      fileUrl = `/uploads/documents/${req.file.filename}`;
      console.log('💾 File uploaded to local storage:', fileUrl);
    }

    // Create document record
    const document = await Document.create({
      name: name || fileName,
      description,
      fileName,
      fileUrl,
      fileType: fileExtension,
      mimeType,
      fileSize,
      category,
      uploadedById: userId,
      organizationId,
      visibility,
      sharedWith: parsedSharedWith,
      tags: parsedTags,
      status: 'active',
      metadata: {
        storageType: useS3Storage ? 's3' : 'local',
        s3Key: s3Key,
        uploadMethod: 'direct'
      }
    });

    // Fetch with associations
    const createdDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });

    console.log('✅ Document uploaded successfully:', createdDocument.id);

    // 🔔 ADMIN NOTIFICATION: Document approval needed for certain types
    const APPROVAL_REQUIRED_TYPES = ['contract', 'certificate', 'id_proof', 'address_proof', 'Legal', 'Compliance'];
    if (APPROVAL_REQUIRED_TYPES.includes(category)) {
      await adminNotificationService.notifyDocumentApprovalNeeded(
        organizationId,
        {
          documentId: createdDocument.id,
          employeeId: userId,
          employeeName: req.user.name,
          documentType: category,
          uploadDate: new Date().toISOString()
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    // Send notification to shared users or organization
    try {
      if (visibility === 'shared' && parsedSharedWith && parsedSharedWith.length > 0) {
        // Send to specific shared users
        for (const sharedUserId of parsedSharedWith) {
          await oneSignalService.sendToUser(
            sharedUserId.toString(),
            {
              title: '📄 Document Shared With You',
              message: `${req.user.name} shared "${name || fileName}" with you`,
              data: {
                type: 'document_shared',
                documentId: createdDocument.id,
                documentName: name || fileName,
                category: category,
                uploadedBy: req.user.name,
                uploadedById: userId,
                timestamp: new Date().toISOString()
              }
            }
          );
        }
        console.log(`✅ Document sharing notifications sent to ${parsedSharedWith.length} users`);
      } else if (visibility === 'organization') {
        // Send to all organization members
        await oneSignalService.sendToOrganization(
          organizationId,
          {
            title: '📄 New Document Available',
            message: `${req.user.name} uploaded "${name || fileName}"`,
            data: {
              type: 'document_uploaded',
              documentId: createdDocument.id,
              documentName: name || fileName,
              category: category,
              uploadedBy: req.user.name,
              uploadedById: userId,
              timestamp: new Date().toISOString()
            }
          }
        );
        console.log(`✅ Document upload notification sent to organization`);
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to send document notification:', notificationError);
      // Don't fail the upload if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: createdDocument
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

/**
 * Get all documents (with filtering and role-based access)
 * @route GET /api/v1/documents
 * @access Private
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const {
      category,
      fileType,
      status = 'active',
      visibility,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    console.log('📋 Fetching documents for user:', userId, 'role:', userRole);

    const offset = (page - 1) * limit;
    const whereClause = {
      organizationId,
      status: status || 'active'
    };

    // Apply filters
    if (category && category !== 'All') whereClause.category = category;
    if (fileType) whereClause.fileType = fileType;
    if (visibility) whereClause.visibility = visibility;

    // Search by name or description
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }

    // Role-based access control
    let accessFilter;
    if (userRole === 'admin' || userRole === 'hr') {
      // Admin and HR can see all documents in organization
      accessFilter = whereClause;
    } else {
      // Regular users can see:
      // 1. Their own documents
      // 2. Public documents
      // 3. Organization-wide documents
      // 4. Documents shared with them
      accessFilter = {
        ...whereClause,
        [Op.or]: [
          { uploadedById: userId },
          { visibility: 'public' },
          { visibility: 'organization' },
          { visibility: 'shared', sharedWith: { [Op.contains]: [userId] } }
        ]
      };
    }

    const { count, rows: documents } = await Document.findAndCountAll({
      where: accessFilter,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ Found ${documents.length} documents`);

    res.json({
      success: true,
      data: documents,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
};

/**
 * Get document by ID
 * @route GET /api/v1/documents/:id
 * @access Private
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const document = await Document.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permissions
    const hasAccess =
      userRole === 'admin' ||
      userRole === 'hr' ||
      document.uploadedById === userId ||
      document.visibility === 'public' ||
      document.visibility === 'organization' ||
      (document.visibility === 'shared' && document.sharedWith.includes(userId));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update access tracking
    await document.update({
      lastAccessedAt: new Date(),
      downloadCount: document.downloadCount + 1
    });

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message
    });
  }
};

/**
 * Update document metadata
 * @route PUT /api/v1/documents/:id
 * @access Private
 */
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const {
      name,
      description,
      category,
      visibility,
      tags,
      sharedWith,
      status
    } = req.body;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Only owner, admin, or HR can update
    if (document.uploadedById !== userId && userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;
    if (sharedWith !== undefined) updateData.sharedWith = sharedWith;
    if (status !== undefined) updateData.status = status;

    await document.update(updateData);

    const updatedDocument = await Document.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });

    // Send notification if sharing permissions changed
    try {
      if (sharedWith !== undefined && sharedWith.length > 0) {
        // Find newly added users (not in original sharedWith)
        const originalSharedWith = document.sharedWith || [];
        const newlyShared = sharedWith.filter(id => !originalSharedWith.includes(id));

        if (newlyShared.length > 0) {
          for (const sharedUserId of newlyShared) {
            await oneSignalService.sendToUser(
              sharedUserId.toString(),
              {
                title: '📄 Document Shared With You',
                message: `${req.user.name} shared "${updatedDocument.name}" with you`,
                data: {
                  type: 'document_shared',
                  documentId: updatedDocument.id,
                  documentName: updatedDocument.name,
                  category: updatedDocument.category,
                  uploadedBy: req.user.name,
                  uploadedById: userId,
                  timestamp: new Date().toISOString()
                }
              }
            );
          }
          console.log(`✅ Document sharing notifications sent to ${newlyShared.length} new users`);
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to send document sharing notification:', notificationError);
      // Don't fail the update if notification fails
    }

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  }
};

/**
 * Delete document
 * @route DELETE /api/v1/documents/:id
 * @access Private
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Only owner, admin, or HR can delete
    if (document.uploadedById !== userId && userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Delete file from storage
    try {
      const storageType = document.metadata?.storageType || 'local';

      if (storageType === 's3' && document.metadata?.s3Key) {
        // Delete from S3
        await s3Service.deleteFileFromS3(document.metadata.s3Key);
        console.log('✅ File deleted from S3');
      } else {
        // Delete from local storage
        const filePath = path.join(__dirname, '../../', document.fileUrl);
        try {
          await fs.unlink(filePath);
          console.log('✅ File deleted from local storage');
        } catch (err) {
          console.warn('⚠️ File not found in local storage, continuing with DB deletion');
        }
      }
    } catch (fileError) {
      console.error('⚠️ Error deleting file from storage:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete by updating status
    await document.update({ status: 'deleted' });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

/**
 * Download document
 * @route GET /api/v1/documents/:id/download
 * @access Private
 */
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permissions
    const hasAccess =
      userRole === 'admin' ||
      userRole === 'hr' ||
      document.uploadedById === userId ||
      document.visibility === 'public' ||
      document.visibility === 'organization' ||
      (document.visibility === 'shared' && document.sharedWith.includes(userId));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update download count
    await document.update({
      downloadCount: document.downloadCount + 1,
      lastAccessedAt: new Date()
    });

    // Generate download URL based on storage type
    const storageType = document.metadata?.storageType || 'local';
    let downloadUrl;

    if (storageType === 's3' && document.metadata?.s3Key) {
      // Generate signed URL for S3
      downloadUrl = await s3Service.getSignedDownloadUrl(document.metadata.s3Key, 3600); // 1 hour expiry
      console.log('📦 Generated S3 signed URL for download');
    } else {
      // Local storage - use relative URL
      downloadUrl = document.fileUrl;
      console.log('💾 Using local storage URL for download');
    }

    res.json({
      success: true,
      data: {
        fileUrl: downloadUrl,
        fileName: document.fileName,
        mimeType: document.mimeType,
        storageType: storageType
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
};

module.exports = exports;

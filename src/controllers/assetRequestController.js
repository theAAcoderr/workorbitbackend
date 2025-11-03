const { AssetRequest, Asset, User } = require('../models');
const { Op } = require('sequelize');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

// @desc    Create asset request
// @route   POST /api/v1/asset-requests
// @access  Private
exports.createAssetRequest = async (req, res) => {
  try {
    const {
      requestType,
      assetId,
      requestedCategory,
      reason,
      priority
    } = req.body;

    // Validate request type specific requirements
    if (requestType === 'new_asset' && !requestedCategory) {
      return res.status(400).json({
        success: false,
        message: 'Requested category is required for new asset requests'
      });
    }

    if (['return_asset', 'replacement', 'repair'].includes(requestType) && !assetId) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required for this request type'
      });
    }

    // If assetId provided, verify it exists and belongs to user (for return/repair)
    if (assetId) {
      const asset = await Asset.findOne({
        where: {
          id: assetId,
          organizationId: req.user.organizationId
        }
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      // For return requests, verify asset is assigned to requesting user
      if (requestType === 'return_asset' && asset.assignedToId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only request to return assets assigned to you'
        });
      }
    }

    const assetRequest = await AssetRequest.create({
      requestType,
      assetId,
      requestedCategory,
      requestedById: req.user.id,
      reason,
      priority: priority || 'medium',
      organizationId: req.user.organizationId,
      status: 'pending'
    });

    const createdRequest = await AssetRequest.findByPk(assetRequest.id, {
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'name', 'category', 'status']
        }
      ]
    });

    // 🔔 ADMIN NOTIFICATION: Asset request created
    await adminNotificationService.notifyAssetRequest(
      req.user.organizationId,
      {
        requestId: assetRequest.id,
        employeeId: req.user.id,
        employeeName: req.user.name,
        assetType: requestType || 'Not specified',
        category: requestedCategory || 'General',
        priority: priority || 'medium',
        estimatedValue: 0
      }
    ).catch(err => console.error('Admin notification error:', err));

    // 🔔 ADMIN NOTIFICATION: High-value asset check (if value field exists)
    if (req.body.estimatedValue && req.body.estimatedValue > 50000) {
      await adminNotificationService.notifyHighValueAssetRequest(
        req.user.organizationId,
        {
          requestId: assetRequest.id,
          employeeId: req.user.id,
          employeeName: req.user.name,
          asset: requestedCategory || requestType,
          value: req.body.estimatedValue
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Asset request created successfully',
      data: createdRequest
    });
  } catch (error) {
    console.error('Create asset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset request',
      error: error.message
    });
  }
};

// @desc    Get all asset requests
// @route   GET /api/v1/asset-requests
// @access  Private
exports.getAssetRequests = async (req, res) => {
  try {
    const {
      status,
      requestType,
      priority,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      organizationId: req.user.organizationId
    };

    // Role-based filtering
    if (req.user.role === 'employee') {
      where.requestedById = req.user.id;
    }

    if (status) where.status = status;
    if (requestType) where.requestType = requestType;
    if (priority) where.priority = priority;

    const offset = (page - 1) * limit;

    const { count, rows: requests } = await AssetRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'employeeId', 'department']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'name', 'category', 'status']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get asset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset requests',
      error: error.message
    });
  }
};

// @desc    Get single asset request
// @route   GET /api/v1/asset-requests/:id
// @access  Private
exports.getAssetRequestById = async (req, res) => {
  try {
    const request = await AssetRequest.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'employeeId', 'phone', 'department']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'name', 'category', 'brand', 'model', 'status']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Asset request not found'
      });
    }

    // Check permission
    if (req.user.role === 'employee' && request.requestedById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get asset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset request',
      error: error.message
    });
  }
};

// @desc    Approve asset request
// @route   POST /api/v1/asset-requests/:id/approve
// @access  Private (Admin, HR)
exports.approveAssetRequest = async (req, res) => {
  try {
    const { notes } = req.body;

    const request = await AssetRequest.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: Asset,
          as: 'asset'
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Asset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    await request.update({
      status: 'approved',
      approvedById: req.user.id,
      approvedAt: new Date(),
      notes: notes || request.notes
    });

    // If it's a return request, mark as completed and unassign asset
    if (request.requestType === 'return_asset' && request.asset) {
      await request.asset.unassign();
      await request.update({
        status: 'completed',
        completedAt: new Date()
      });
    }

    const updatedRequest = await AssetRequest.findByPk(request.id, {
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'asset'
        }
      ]
    });

    // Send notification to employee about request approval
    try {
      const requestTypeDisplay = request.requestType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const message = request.asset
        ? `Your ${requestTypeDisplay} request for ${request.asset.name} has been approved by ${req.user.name}`
        : `Your ${requestTypeDisplay} request for ${request.requestedCategory} has been approved by ${req.user.name}`;

      await oneSignalService.sendToUser(
        request.requestedById.toString(),
        {
          title: '✅ Asset Request Approved',
          message: message,
          data: {
            type: 'asset_request_approved',
            requestId: request.id,
            requestType: request.requestType,
            assetId: request.assetId,
            requestedCategory: request.requestedCategory,
            approvedBy: req.user.name,
            notes: notes || '',
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Asset request approval notification sent to employee ${request.requestedById}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send asset request approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Asset request approved successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Approve asset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve asset request',
      error: error.message
    });
  }
};

// @desc    Reject asset request
// @route   POST /api/v1/asset-requests/:id/reject
// @access  Private (Admin, HR)
exports.rejectAssetRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const request = await AssetRequest.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Asset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    await request.update({
      status: 'rejected',
      approvedById: req.user.id,
      approvedAt: new Date(),
      rejectionReason
    });

    const updatedRequest = await AssetRequest.findByPk(request.id, {
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'name', 'category']
        }
      ]
    });

    // Send notification to employee about request rejection
    try {
      const requestTypeDisplay = request.requestType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const assetInfo = updatedRequest.asset
        ? updatedRequest.asset.name
        : request.requestedCategory;

      await oneSignalService.sendToUser(
        request.requestedById.toString(),
        {
          title: '❌ Asset Request Rejected',
          message: `Your ${requestTypeDisplay} request for ${assetInfo} was rejected by ${req.user.name}`,
          data: {
            type: 'asset_request_rejected',
            requestId: request.id,
            requestType: request.requestType,
            assetId: request.assetId,
            requestedCategory: request.requestedCategory,
            rejectedBy: req.user.name,
            rejectionReason: rejectionReason,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Asset request rejection notification sent to employee ${request.requestedById}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send asset request rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Asset request rejected',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Reject asset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject asset request',
      error: error.message
    });
  }
};

// @desc    Cancel asset request
// @route   POST /api/v1/asset-requests/:id/cancel
// @access  Private (Request owner)
exports.cancelAssetRequest = async (req, res) => {
  try {
    const request = await AssetRequest.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
        requestedById: req.user.id
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Asset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request that is ${request.status}`
      });
    }

    await request.update({
      status: 'cancelled'
    });

    res.status(200).json({
      success: true,
      message: 'Asset request cancelled successfully',
      data: request
    });
  } catch (error) {
    console.error('Cancel asset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel asset request',
      error: error.message
    });
  }
};

// @desc    Get my asset requests
// @route   GET /api/v1/asset-requests/my-requests
// @access  Private
exports.getMyAssetRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {
      requestedById: req.user.id,
      organizationId: req.user.organizationId
    };

    if (status) where.status = status;

    const requests = await AssetRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'name', 'category', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get my asset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your asset requests',
      error: error.message
    });
  }
};

// @desc    Get pending asset requests count
// @route   GET /api/v1/asset-requests/pending-count
// @access  Private (Admin, HR)
exports.getPendingRequestsCount = async (req, res) => {
  try {
    const count = await AssetRequest.count({
      where: {
        organizationId: req.user.organizationId,
        status: 'pending'
      }
    });

    res.status(200).json({
      success: true,
      data: { pendingCount: count }
    });
  } catch (error) {
    console.error('Get pending requests count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests count',
      error: error.message
    });
  }
};

module.exports = exports;

const ProgressReport = require('../models/ProgressReport');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const multer = require('multer');
const path = require('path');
const s3Service = require('../../services/s3.service');

// Configure multer for file uploads (using memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xls|xlsx)$/i;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream' // For files without proper MIME type
    ];

    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype.toLowerCase()) || file.mimetype === 'application/octet-stream';

    console.log('File upload check:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname,
      mimetypeAllowed
    });

    if (mimetypeAllowed && extname) {
      return cb(null, true);
    } else {
      console.error('File rejected:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extname,
        mimetypeAllowed
      });
      cb(new Error(`File type not allowed. Filename: ${file.originalname}, MIME type: ${file.mimetype}`));
    }
  }
});

const progressReportController = {
  // Get all progress reports for a user or organization
  async getProgressReports(req, res) {
    try {
      const { organizationId, id: userId, role, hrCode, orgCode } = req.user;
      const { myReportsOnly = 'true', startDate, endDate, projectId, status } = req.query;

      let whereClause = { organizationId };
      let includeUser = false;

      // If myReportsOnly is true, only get current user's reports
      if (myReportsOnly === 'true') {
        whereClause.userId = userId;
      } else {
        // For team reports, apply role-based filtering
        if (role === 'employee') {
          // Employees can only see their own reports
          whereClause.userId = userId;
        } else if (role === 'hr') {
          // HR can see reports from their team (same hrCode)
          if (hrCode) {
            includeUser = true; // Need to join with User table to filter by hrCode
          } else {
            // If no hrCode, only show own reports
            whereClause.userId = userId;
          }
        } else if (role === 'manager') {
          // Managers can see reports from their direct reports
          includeUser = true; // Need to join with User table to filter by managerId
        }
        // Admin can see all reports (no additional filtering)
      }

      let reports;

      if (includeUser) {
        // Use Sequelize ORM for safe queries (no SQL injection)
        const where = { organizationId };
        const userWhere = {};

        if (role === 'hr' && hrCode) {
          userWhere.hrCode = hrCode;
        } else if (role === 'manager') {
          userWhere.managerId = userId;
        }

        // Build additional WHERE clauses safely
        if (startDate) {
          where.reportDate = { ...where.reportDate, [sequelize.Op.gte]: startDate };
        }
        if (endDate) {
          where.reportDate = { ...where.reportDate, [sequelize.Op.lte]: endDate };
        }
        if (projectId) {
          where.projectId = projectId;
        }
        if (status) {
          where.status = status;
        }

        const results = await ProgressReport.findAll({
          where,
          include: [
            {
              model: User,
              as: 'user',
              where: userWhere,
              attributes: ['id', 'name', 'email', 'employeeId']
            }
          ],
          order: [
            ['reportDate', 'DESC'],
            ['createdAt', 'DESC']
          ],
          limit: 100
        });

        reports = results;
      } else {
        // Use standard query for simple cases
        // Apply additional filters to whereClause
        if (startDate || endDate) {
          whereClause.reportDate = {};
          if (startDate) whereClause.reportDate[Op.gte] = new Date(startDate);
          if (endDate) whereClause.reportDate[Op.lte] = new Date(endDate);
        }
        if (projectId) {
          whereClause.projectId = projectId;
        }
        if (status) {
          whereClause.status = status;
        }

        let queryOptions = {
          where: whereClause,
          order: [['reportDate', 'DESC'], ['createdAt', 'DESC']],
          limit: 100
        };

        const reportInstances = await ProgressReport.findAll(queryOptions);
        reports = reportInstances.map(r => r.toJSON());
      }

      // Format reports for frontend compatibility
      const formattedReports = reports.map(report => ({
        id: report.id,
        employeeId: report.userId,
        employeeName: report.userName,
        reportDate: report.reportDate.toISOString().split('T')[0],
        projectId: report.projectId,
        projectName: report.projectName,
        taskId: report.taskId,
        taskName: report.taskName,
        summary: report.summary,
        hoursWorked: parseFloat(report.hoursWorked),
        progress: report.progressPercentage,
        progressPercentage: report.progressPercentage,
        challenges: report.challenges,
        imageUrls: report.imageUrls || [],
        documentUrls: report.documentUrls || [],
        status: report.status,
        submittedAt: report.submittedAt,
        createdAt: report.createdAt
      }));

      res.json({
        success: true,
        reports: formattedReports,
        count: formattedReports.length
      });
    } catch (error) {
      console.error('Error fetching progress reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress reports',
        error: error.message
      });
    }
  },

  // Get a single progress report by ID
  async getProgressReportById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const report = await ProgressReport.findOne({
        where: { id, organizationId }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found'
        });
      }

      // Check if user can access this report
      if (role === 'employee' && report.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({ success: true, report });
    } catch (error) {
      console.error('Error fetching progress report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress report',
        error: error.message
      });
    }
  },

  // Create a new progress report
  async createProgressReport(req, res) {
    try {
      const { organizationId, id: userId, name: userName } = req.user;
      const {
        reportDate,
        projectId,
        projectName,
        taskId,
        taskName,
        summary,
        hoursWorked,
        progressPercentage,
        challenges
      } = req.body;

      // Validate required fields
      if (!reportDate || !summary || !hoursWorked || progressPercentage === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: reportDate, summary, hoursWorked, progressPercentage'
        });
      }

      // Validate project exists if projectId provided
      if (projectId) {
        const project = await Project.findOne({
          where: { id: projectId, organizationId }
        });

        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        }
      }

      // Validate task exists if taskId provided
      if (taskId) {
        const task = await Task.findOne({
          where: { id: taskId }
        });

        if (!task) {
          return res.status(404).json({
            success: false,
            message: 'Task not found'
          });
        }

        // Update task progress if provided
        if (progressPercentage !== undefined) {
          await task.update({
            progress: progressPercentage,
            updatedBy: userId
          });

          // Auto-update task status based on progress
          if (progressPercentage === 100 && task.status !== 'done') {
            await task.update({
              status: 'done',
              completedDate: new Date(),
              updatedBy: userId
            });
          } else if (progressPercentage > 0 && progressPercentage < 100 && task.status === 'todo') {
            await task.update({
              status: 'inProgress',
              updatedBy: userId
            });
          }
        }
      }

      // Handle file uploads to S3
      let imageUrls = [];
      let documentUrls = [];

      if (req.files && req.files.length > 0) {
        console.log(`Processing ${req.files.length} files for S3 upload`);

        for (const file of req.files) {
          try {
            // Upload file to S3
            const uploadResult = await s3Service.uploadFile(file, 'progress-reports');

            if (uploadResult.success) {
              console.log(`File uploaded to S3: ${uploadResult.data.url}`);

              if (file.mimetype.startsWith('image/')) {
                imageUrls.push(uploadResult.data.url);
              } else {
                documentUrls.push(uploadResult.data.url);
              }
            } else {
              console.error(`Failed to upload file to S3: ${uploadResult.error}`);
              // Continue with other files even if one fails
            }
          } catch (uploadError) {
            console.error(`Error uploading file to S3: ${uploadError.message}`);
            // Continue with other files even if one fails
          }
        }

        console.log(`Upload complete - Images: ${imageUrls.length}, Documents: ${documentUrls.length}`);
      }

      // Create progress report
      const report = await ProgressReport.create({
        userId,
        userName,
        organizationId,
        projectId: projectId || null,
        projectName: projectName || null,
        taskId: taskId || null,
        taskName: taskName || null,
        reportDate: new Date(reportDate),
        summary,
        hoursWorked: parseFloat(hoursWorked),
        progressPercentage: parseInt(progressPercentage),
        challenges: challenges || null,
        imageUrls,
        documentUrls,
        status: 'submitted'
      });

      // Add task comment if taskId is provided
      if (taskId) {
        const Task = require('../models/Task');
        const task = await Task.findByPk(taskId);

        if (task) {
          const comments = task.comments || [];
          const newComment = {
            id: require('crypto').randomUUID(),
            userId,
            userName,
            comment: `Daily Progress Report - ${new Date(reportDate).toISOString().split('T')[0]}\n\nSummary: ${summary}\nHours Worked: ${hoursWorked}\nProgress: ${progressPercentage}%${challenges ? `\nChallenges: ${challenges}` : ''}`,
            timestamp: Date.now()
          };

          await task.update({
            comments: [...comments, newComment],
            updatedBy: userId
          });
        }
      }

      res.status(201).json({
        success: true,
        report,
        message: 'Progress report created successfully'
      });
    } catch (error) {
      console.error('Error creating progress report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create progress report',
        error: error.message
      });
    }
  },

  // Update a progress report
  async updateProgressReport(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const report = await ProgressReport.findOne({
        where: { id, organizationId }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found'
        });
      }

      // Check if user can update this report
      if (role === 'employee' && report.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Only allow updates to non-reviewed reports or by managers/hr/admin
      if (report.status === 'reviewed' && role === 'employee') {
        return res.status(403).json({
          success: false,
          message: 'Cannot update reviewed reports'
        });
      }

      const updateData = {
        ...req.body,
        id: undefined, // Prevent ID update
        userId: undefined, // Prevent user change
        organizationId: undefined // Prevent org change
      };

      await report.update(updateData);

      res.json({
        success: true,
        report,
        message: 'Progress report updated successfully'
      });
    } catch (error) {
      console.error('Error updating progress report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress report',
        error: error.message
      });
    }
  },

  // Delete a progress report
  async deleteProgressReport(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const report = await ProgressReport.findOne({
        where: { id, organizationId }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found'
        });
      }

      // Check if user can delete this report
      if (role === 'employee' && report.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Clean up uploaded files from S3
      const allFiles = [...(report.imageUrls || []), ...(report.documentUrls || [])];
      for (const fileUrl of allFiles) {
        try {
          // Extract S3 key from URL
          const url = new URL(fileUrl);
          const key = url.pathname.substring(1); // Remove leading slash

          const deleteResult = await s3Service.deleteFile(key);
          if (deleteResult.success) {
            console.log(`Successfully deleted file from S3: ${key}`);
          } else {
            console.warn(`Failed to delete file from S3: ${deleteResult.error}`);
          }
        } catch (fileError) {
          console.warn('Error deleting file from S3:', fileError.message);
        }
      }

      await report.destroy();

      res.json({
        success: true,
        message: 'Progress report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting progress report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete progress report',
        error: error.message
      });
    }
  },

  // Get progress statistics
  async getProgressStats(req, res) {
    try {
      const { organizationId, id: userId, role } = req.user;
      const { startDate, endDate, projectId } = req.query;

      let whereClause = { organizationId };

      // Apply role-based filtering
      if (role === 'employee') {
        whereClause.userId = userId;
      }

      // Date range filtering
      if (startDate || endDate) {
        whereClause.reportDate = {};
        if (startDate) whereClause.reportDate[Op.gte] = new Date(startDate);
        if (endDate) whereClause.reportDate[Op.lte] = new Date(endDate);
      }

      // Project filtering
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const stats = await ProgressReport.findAll({
        where: whereClause,
        attributes: [
          [fn('COUNT', col('id')), 'totalReports'],
          [fn('SUM', col('hoursWorked')), 'totalHours'],
          [fn('AVG', col('progressPercentage')), 'averageProgress'],
          [fn('COUNT', literal('CASE WHEN status = \'submitted\' THEN 1 END')), 'submittedReports'],
          [fn('COUNT', literal('CASE WHEN status = \'reviewed\' THEN 1 END')), 'reviewedReports']
        ],
        raw: true
      });

      res.json({
        success: true,
        stats: stats[0] || {
          totalReports: 0,
          totalHours: 0,
          averageProgress: 0,
          submittedReports: 0,
          reviewedReports: 0
        }
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress statistics',
        error: error.message
      });
    }
  },

  // Middleware for file upload
  upload: upload.array('files', 10)
};

module.exports = progressReportController;
const { ActivityLog, User, Attendance } = require('../models');
const { Op, sequelize } = require('sequelize');

// Associations are defined in models/index.js

/**
 * @route   GET /api/v1/activity-logs
 * @desc    Get activity logs with filters
 * @access  Private (Admin, HR, Manager)
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    console.log('=== getActivityLogs called ===');
    console.log('User:', req.user.id, req.user.email, req.user.role);
    console.log('OrganizationId:', req.user.organizationId);

    const organizationId = req.user.organizationId;
    const {
      userId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const whereClause = {};

    // Filter by user if provided
    if (userId) {
      whereClause.userId = userId;
    } else {
      // If no specific user, only show logs from same organization
      // Get all users from organization
      const orgUsers = await User.findAll({
        where: { organizationId },
        attributes: ['id']
      });
      whereClause.userId = { [Op.in]: orgUsers.map(u => u.id) };
    }

    // Filter by activity type (activityType not action)
    if (action) {
      whereClause.activityType = action;
    }

    // Filter by date range (use timestamp not createdAt)
    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture'],
          required: false // Don't exclude logs without users
        },
        {
          model: Attendance,
          as: 'attendance',
          attributes: ['id', 'checkInTime', 'checkOutTime', 'date'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    // Transform logs to match Flutter app expectations
    const transformedLogs = logs.map(log => {
      const logData = log.toJSON();
      return {
        ...logData,
        action: logData.activityType || 'unknown', // Map activityType to action
        entityType: 'attendance', // Default entity type
        entityId: logData.attendanceId || logData.id,
        // Ensure user data is properly formatted
        user: logData.user ? {
          id: logData.user.id,
          name: logData.user.name || 'Unknown User',
          email: logData.user.email,
          role: logData.user.role,
          profilePicture: logData.user.profilePicture
        } : null
      };
    });

    console.log('Found logs:', count);
    console.log('Returning logs:', transformedLogs.length);

    res.json({
      success: true,
      count,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      logs: transformedLogs,
      data: {
        logs: transformedLogs,
        pagination: {
          total: count,
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/activity-logs/user/:userId
 * @desc    Get activity logs for specific user
 * @access  Private (User can view own logs, Admin/HR can view all)
 */
exports.getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user.organizationId;
    const { limit = 50, offset = 0, action, startDate, endDate } = req.query;

    // Check if user can view these logs
    if (req.user.id !== parseInt(userId) && !['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these activity logs'
      });
    }

    // Verify user belongs to same organization
    const user = await User.findOne({
      where: { id: userId, organizationId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const whereClause = { userId };

    // Filter by action type
    if (action) {
      whereClause.action = action;
    }

    // Filter by date range
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      count,
      total: count,
      logs,
      data: logs
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/v1/activity-logs
 * @desc    Create activity log (auto-logged by system)
 * @access  Private (Internal use)
 */
exports.createActivityLog = async (req, res, next) => {
  try {
    const { userId, attendanceId, action, description, metadata } = req.body;

    // Verify user exists and belongs to same organization
    const user = await User.findOne({
      where: {
        id: userId || req.user.id,
        organizationId: req.user.organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const log = await ActivityLog.create({
      userId: userId || req.user.id,
      attendanceId: attendanceId || null,
      action: action || 'custom',
      description,
      metadata: metadata || {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: log
    });
  } catch (error) {
    console.error('Create activity log error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/activity-logs/stats
 * @desc    Get activity statistics
 * @access  Private (Admin, HR, Manager)
 */
exports.getActivityStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { startDate, endDate } = req.query;

    // Get all users from organization
    const orgUsers = await User.findAll({
      where: { organizationId },
      attributes: ['id']
    });
    const userIds = orgUsers.map(u => u.id);

    const whereClause = {
      userId: { [Op.in]: userIds }
    };

    // Filter by date range
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get total logs
    const totalLogs = await ActivityLog.count({ where: whereClause });

    // Get action distribution
    const actionCounts = await ActivityLog.findAll({
      where: whereClause,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Get most active users
    const mostActiveUsers = await ActivityLog.findAll({
      where: whereClause,
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('ActivityLog.id')), 'activityCount']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      group: ['userId', 'user.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('ActivityLog.id')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Get activity by date
    const activityByDate = await ActivityLog.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
      limit: 30,
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        actionDistribution: actionCounts,
        mostActiveUsers,
        activityByDate
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/activity-logs/cleanup
 * @desc    Cleanup old activity logs
 * @access  Private (Admin only)
 */
exports.cleanupActivityLogs = async (req, res, next) => {
  try {
    const { daysOld = 90 } = req.body;

    // Only allow admin to cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can cleanup activity logs'
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    // Get users from organization
    const orgUsers = await User.findAll({
      where: { organizationId: req.user.organizationId },
      attributes: ['id']
    });

    const deletedCount = await ActivityLog.destroy({
      where: {
        userId: { [Op.in]: orgUsers.map(u => u.id) },
        createdAt: { [Op.lt]: cutoffDate }
      }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} activity logs older than ${daysOld} days`,
      deletedCount
    });
  } catch (error) {
    console.error('Cleanup activity logs error:', error);
    next(error);
  }
};

// Helper function to log activity (can be called from other controllers)
exports.logActivity = async (userId, action, description, metadata = {}, attendanceId = null) => {
  try {
    await ActivityLog.create({
      userId,
      attendanceId,
      action,
      description,
      metadata
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};


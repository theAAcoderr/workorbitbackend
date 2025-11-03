const SystemActivityLog = require('../models/SystemActivityLog');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * Get all activity logs with filters
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const where = {
      organizationId: req.user.organizationId
    };

    // Apply filters
    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await SystemActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity log by ID
 */
exports.getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await SystemActivityLog.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    res.json({
      success: true,
      data: { log }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error.message
    });
  }
};

/**
 * Create activity log
 */
exports.createActivityLog = async (req, res) => {
  try {
    const { action, entityType, entityId, description, details } = req.body;

    const log = await SystemActivityLog.create({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action,
      entityType,
      entityId,
      description,
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: { log }
    });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      error: error.message
    });
  }
};

/**
 * Get activity logs by user
 */
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await SystemActivityLog.findAndCountAll({
      where: {
        userId,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs by entity
 */
exports.getEntityActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await SystemActivityLog.findAndCountAll({
      where: {
        entityType,
        entityId,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get entity activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity log statistics
 */
exports.getActivityLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      organizationId: req.user.organizationId
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const [
      totalLogs,
      actionStats,
      entityTypeStats,
      userStats
    ] = await Promise.all([
      SystemActivityLog.count({ where }),
      SystemActivityLog.findAll({
        where,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        raw: true
      }),
      SystemActivityLog.findAll({
        where,
        attributes: [
          'entityType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['entityType'],
        raw: true
      }),
      SystemActivityLog.findAll({
        where,
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'email']
          }
        ],
        group: ['userId', 'user.id', 'user.name', 'user.email'],
        order: [[sequelize.fn('COUNT', sequelize.col('SystemActivityLog.id')), 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalLogs,
          byAction: actionStats,
          byEntityType: entityTypeStats,
          topUsers: userStats
        }
      }
    });
  } catch (error) {
    console.error('Get activity log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log statistics',
      error: error.message
    });
  }
};

/**
 * Delete activity log (admin only)
 */
exports.deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await SystemActivityLog.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    await log.destroy();

    res.json({
      success: true,
      message: 'Activity log deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity log',
      error: error.message
    });
  }
};

/**
 * Export activity logs
 */
exports.exportActivityLogs = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const where = {
      organizationId: req.user.organizationId
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const logs = await SystemActivityLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      // Convert to CSV
      const csv = logs.map(log => ({
        ID: log.id,
        User: log.user?.name || 'Unknown',
        Action: log.action,
        EntityType: log.entityType || '',
        EntityID: log.entityId || '',
        Description: log.description || '',
        Timestamp: log.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.csv"`);
      res.json({
        success: true,
        data: { logs: csv, format: 'csv' }
      });
    } else {
      res.json({
        success: true,
        data: { logs, format: 'json' }
      });
    }
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs',
      error: error.message
    });
  }
};
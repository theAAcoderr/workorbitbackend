const analyticsService = require('../services/analyticsService');
const { logger } = require('../middleware/logger');

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 */
const getDashboard = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await analyticsService.getDashboardStats(organizationId, dateRange);

    res.json(result);
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/analytics/attendance-trends:
 *   get:
 *     summary: Get attendance trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Trend period
 *     responses:
 *       200:
 *         description: Attendance trends retrieved successfully
 */
const getAttendanceTrends = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const period = req.query.period || 'weekly';

    const trends = await analyticsService.getAttendanceTrends(organizationId, period);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance trends',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/analytics/employee-performance/{userId}:
 *   get:
 *     summary: Get employee performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Employee performance metrics retrieved successfully
 */
const getEmployeePerformance = async (req, res) => {
  try {
    const { userId } = req.params;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Check if user has permission to view this employee's data
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this employee\'s performance'
      });
    }

    const performance = await analyticsService.getEmployeePerformance(userId, dateRange);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee performance',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getAttendanceTrends,
  getEmployeePerformance
};

const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/activity-logs/stats
 * @desc    Get activity statistics
 * @access  Private (Admin, HR, Manager)
 */
router.get('/stats',
  authorizeRoles('admin', 'hr', 'manager'),
  cacheMiddleware(300),
  activityLogController.getActivityStats
);

/**
 * @route   GET /api/v1/activity-logs
 * @desc    Get activity logs with filters
 * @access  Private (Admin, HR, Manager)
 */
router.get('/',
  authorizeRoles('admin', 'hr', 'manager'),
  cacheMiddleware(60),
  activityLogController.getActivityLogs
);

/**
 * @route   POST /api/v1/activity-logs
 * @desc    Create activity log
 * @access  Private (Internal use)
 */
router.post('/',
  activityLogController.createActivityLog
);

/**
 * @route   GET /api/v1/activity-logs/user/:userId
 * @desc    Get activity logs for specific user
 * @access  Private (User can view own logs, Admin/HR can view all)
 */
router.get('/user/:userId',
  cacheMiddleware(60),
  activityLogController.getUserActivityLogs
);

/**
 * @route   DELETE /api/v1/activity-logs/cleanup
 * @desc    Cleanup old activity logs
 * @access  Private (Admin only)
 */
router.delete('/cleanup',
  authorizeRoles('admin'),
  activityLogController.cleanupActivityLogs
);

module.exports = router;


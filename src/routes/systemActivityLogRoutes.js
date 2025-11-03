const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const {
  getActivityLogs,
  getActivityLogById,
  createActivityLog,
  getUserActivityLogs,
  getEntityActivityLogs,
  getActivityLogStats,
  deleteActivityLog,
  exportActivityLogs
} = require('../controllers/systemActivityLogController');

// All routes require authentication
router.use(authMiddleware);

// Get all activity logs (with filters)
router.get('/', getActivityLogs);

// Get activity log statistics
router.get('/stats', getActivityLogStats);

// Export activity logs
router.get('/export', authorizeRoles(['admin', 'hr']), exportActivityLogs);

// Get activity logs by user
router.get('/user/:userId', getUserActivityLogs);

// Get activity logs by entity
router.get('/entity/:entityType/:entityId', getEntityActivityLogs);

// Get activity log by ID
router.get('/:id', getActivityLogById);

// Create activity log
router.post('/', createActivityLog);

// Delete activity log (admin only)
router.delete('/:id', authorizeRoles(['admin']), deleteActivityLog);

module.exports = router;
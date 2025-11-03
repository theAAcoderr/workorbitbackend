const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const {
  getDashboard,
  getAttendanceTrends,
  getEmployeePerformance
} = require('../controllers/analyticsController');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

// Dashboard analytics (cached for 5 minutes)
router.get('/dashboard', cacheMiddleware(300), getDashboard);

// Attendance trends (cached for 10 minutes)
router.get('/attendance-trends', cacheMiddleware(600), getAttendanceTrends);

// Employee performance (cached for 5 minutes)
router.get('/employee-performance/:userId', cacheMiddleware(300), getEmployeePerformance);

module.exports = router;

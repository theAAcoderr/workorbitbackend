const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  updateLocation,
  submitDailyPlan,
  submitDailyReport,
  getAttendanceHistory,
  getGeofences,
  getDailyPlans,
  getDailyReports,
  getMonthlyStats,
  getWeeklyHours,
  getLocationData,
  getActivities
} = require('../controllers/attendanceController');

// All routes require authentication
router.use(authMiddleware);

// Attendance routes (POST routes not cached)
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
// Cache for 1 minute (frequently updated)
router.get('/today', cacheMiddleware(60), getTodayAttendance);
router.post('/location', updateLocation);
router.post('/update-location', updateLocation); // Re-enabled after fixing endpoint calls
// Cache for 3 minutes
router.get('/history', cacheMiddleware(180), getAttendanceHistory);

// Daily plan and report routes
router.post('/daily-plan', submitDailyPlan);
router.post('/daily-report', submitDailyReport);
// Cache for 2 minutes
router.get('/daily-plans', cacheMiddleware(120), getDailyPlans);
router.get('/daily-reports', cacheMiddleware(120), getDailyReports);

// Geofence routes
// Cache for 10 minutes (rarely changes)
router.get('/geofences', cacheMiddleware(600), getGeofences);

// Additional dashboard endpoints
// Cache for 5 minutes
router.get('/monthly-stats', cacheMiddleware(300), getMonthlyStats);
router.get('/weekly-hours', cacheMiddleware(300), getWeeklyHours);
router.get('/location-data', cacheMiddleware(180), getLocationData);
router.get('/activities', cacheMiddleware(120), getActivities);

module.exports = router;
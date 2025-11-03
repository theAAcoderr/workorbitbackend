const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/reports/attendance/overview
 * @desc    Get attendance overview statistics
 * @access  Private
 */
router.get('/attendance/overview', reportsController.getAttendanceOverview);

/**
 * @route   GET /api/v1/reports/attendance/history
 * @desc    Get attendance history with filters
 * @access  Private
 */
router.get('/attendance/history', reportsController.getAttendanceHistory);

/**
 * @route   GET /api/v1/reports/attendance/weekly-trend
 * @desc    Get weekly attendance trend
 * @access  Private
 */
router.get('/attendance/weekly-trend', reportsController.getWeeklyTrend);

/**
 * @route   GET /api/v1/reports/attendance/recent-activities
 * @desc    Get recent activities
 * @access  Private
 */
router.get('/attendance/recent-activities', reportsController.getRecentActivities);

/**
 * @route   GET /api/v1/reports/export
 * @desc    Export reports in various formats
 * @access  Private
 */
router.get('/export', reportsController.exportReport);

module.exports = router;

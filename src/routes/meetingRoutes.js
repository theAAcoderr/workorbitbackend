const express = require('express');
const router = express.Router();

const meetingController = require('../controllers/meetingController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const {
  validateCreateMeeting,
  validateUpdateMeeting,
  validateMeetingId,
  validateAttendeeResponse,
  validateCompleteMeeting,
  validateGetMeetings
} = require('../validators/meetingValidator');

// Apply authentication to all meeting routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/meetings
 * @desc    Get meetings with optional filters
 * @access  Private (authenticated users)
 * @query   type, status, startDate, endDate, search, showOnlyMyMeetings, showPastMeetings
 */
router.get('/', validateGetMeetings, meetingController.getMeetings);

/**
 * @route   GET /api/v1/meetings/upcoming
 * @desc    Get upcoming meetings for the authenticated user
 * @access  Private (authenticated users)
 * @query   days (optional, default: 7)
 */
router.get('/upcoming', validateGetMeetings, meetingController.getUpcomingMeetings);

/**
 * @route   GET /api/v1/meetings/today
 * @desc    Get today's meetings for the authenticated user
 * @access  Private (authenticated users)
 */
router.get('/today', meetingController.getTodayMeetings);

/**
 * @route   GET /api/v1/meetings/stats
 * @desc    Get meeting statistics for the authenticated user
 * @access  Private (authenticated users)
 */
router.get('/stats', meetingController.getMeetingStats);

/**
 * @route   GET /api/v1/meetings/:id
 * @desc    Get meeting by ID
 * @access  Private (authenticated users with access to the meeting)
 */
router.get('/:id', validateMeetingId, meetingController.getMeetingById);

/**
 * @route   GET /api/v1/meetings/:id/summary
 * @desc    Get meeting summary (for completed meetings)
 * @access  Private (authenticated users with access to the meeting)
 */
router.get('/:id/summary', validateMeetingId, meetingController.getMeetingSummary);

/**
 * @route   POST /api/v1/meetings
 * @desc    Create a new meeting
 * @access  Private (authenticated users)
 */
router.post(
  '/',
  validateCreateMeeting,
  meetingController.createMeeting
);

/**
 * @route   PUT /api/v1/meetings/:id
 * @desc    Update meeting
 * @access  Private (meeting creator, admin, or HR)
 */
router.put(
  '/:id',
  validateMeetingId,
  validateUpdateMeeting,
  meetingController.updateMeeting
);

/**
 * @route   POST /api/v1/meetings/:id/response
 * @desc    Update attendee response to meeting invitation
 * @access  Private (meeting attendees)
 */
router.post(
  '/:id/response',
  validateMeetingId,
  validateAttendeeResponse,
  meetingController.updateAttendeeResponse
);

/**
 * @route   POST /api/v1/meetings/:id/attendance
 * @desc    Mark attendance for a meeting
 * @access  Private (meeting attendees)
 */
router.post(
  '/:id/attendance',
  validateMeetingId,
  meetingController.markAttendance
);

/**
 * @route   POST /api/v1/meetings/:id/complete
 * @desc    Mark meeting as completed with notes and action items
 * @access  Private (meeting creator, admin, or HR)
 */
router.post(
  '/:id/complete',
  validateMeetingId,
  validateCompleteMeeting,
  meetingController.completeMeeting
);

/**
 * @route   POST /api/v1/meetings/:id/cancel
 * @desc    Cancel a meeting
 * @access  Private (meeting creator, admin, or HR)
 */
router.post(
  '/:id/cancel',
  validateMeetingId,
  meetingController.cancelMeeting
);

/**
 * @route   DELETE /api/v1/meetings/:id
 * @desc    Delete a meeting
 * @access  Private (meeting creator, admin, or HR)
 */
router.delete(
  '/:id',
  validateMeetingId,
  meetingController.deleteMeeting
);

module.exports = router;
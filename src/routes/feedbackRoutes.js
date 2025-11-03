const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const {
  createFeedbackValidators,
  updateFeedbackValidators,
  getFeedbackByIdValidators,
  acknowledgeFeedbackValidators,
  archiveFeedbackValidators,
  getFeedbackListValidators,
  getTeamMemberFeedbackValidators
} = require('../middleware/validators/feedbackValidators');

/**
 * @route   POST /api/v1/feedback
 * @desc    Create new feedback
 * @access  Private - All authenticated users
 */
router.post(
  '/',
  authMiddleware,
  createFeedbackValidators,
  feedbackController.createFeedback
);

/**
 * @route   GET /api/v1/feedback/stats
 * @desc    Get feedback statistics
 * @access  Private - All authenticated users
 * @note    Must be defined before /:id route to avoid conflict
 */
router.get(
  '/stats',
  authMiddleware,
  feedbackController.getFeedbackStats
);

/**
 * @route   GET /api/v1/feedback/sent
 * @desc    Get feedback submitted by current user
 * @access  Private - All authenticated users
 */
router.get(
  '/sent',
  authMiddleware,
  getFeedbackListValidators,
  feedbackController.getSentFeedback
);

/**
 * @route   GET /api/v1/feedback/received
 * @desc    Get feedback received by current user
 * @access  Private - All authenticated users
 */
router.get(
  '/received',
  authMiddleware,
  getFeedbackListValidators,
  feedbackController.getReceivedFeedback
);

/**
 * @route   GET /api/v1/feedback/team
 * @desc    Get feedback for team members
 * @access  Private - Manager, HR, Admin only
 */
router.get(
  '/team',
  authMiddleware,
  authorizeRoles('manager', 'hr', 'admin'),
  getFeedbackListValidators,
  feedbackController.getTeamFeedback
);

/**
 * @route   GET /api/v1/feedback/team/:userId
 * @desc    Get feedback for a specific team member
 * @access  Private - Manager, HR, Admin only
 */
router.get(
  '/team/:userId',
  authMiddleware,
  authorizeRoles('manager', 'hr', 'admin'),
  getTeamMemberFeedbackValidators,
  feedbackController.getTeamMemberFeedback
);

/**
 * @route   GET /api/v1/feedback/:id
 * @desc    Get feedback by ID
 * @access  Private - Must be submitter, recipient, or authorized role
 */
router.get(
  '/:id',
  authMiddleware,
  getFeedbackByIdValidators,
  feedbackController.getFeedbackById
);

/**
 * @route   GET /api/v1/feedback
 * @desc    Get all feedback (filtered by role)
 * @access  Private - Role-based access
 */
router.get(
  '/',
  authMiddleware,
  getFeedbackListValidators,
  feedbackController.getAllFeedback
);

/**
 * @route   PUT /api/v1/feedback/:id
 * @desc    Update feedback
 * @access  Private - Only submitter (within 24 hours)
 */
router.put(
  '/:id',
  authMiddleware,
  updateFeedbackValidators,
  feedbackController.updateFeedback
);

/**
 * @route   POST /api/v1/feedback/:id/acknowledge
 * @desc    Acknowledge feedback
 * @access  Private - Only recipient
 */
router.post(
  '/:id/acknowledge',
  authMiddleware,
  acknowledgeFeedbackValidators,
  feedbackController.acknowledgeFeedback
);

/**
 * @route   POST /api/v1/feedback/:id/archive
 * @desc    Archive feedback
 * @access  Private - Recipient or authorized roles
 */
router.post(
  '/:id/archive',
  authMiddleware,
  archiveFeedbackValidators,
  feedbackController.archiveFeedback
);

/**
 * @route   DELETE /api/v1/feedback/:id
 * @desc    Delete feedback
 * @access  Private - Submitter (within 24h) or Admin/HR
 */
router.delete(
  '/:id',
  authMiddleware,
  getFeedbackByIdValidators,
  feedbackController.deleteFeedback
);

module.exports = router;

const express = require('express');
const router = express.Router();
const performanceReviewController = require('../controllers/performanceReviewController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/performance-reviews
 * @desc    Get all reviews for current user
 * @access  Private
 */
router.get('/', performanceReviewController.getMyReviews);

/**
 * @route   GET /api/v1/performance-reviews/stats
 * @desc    Get review statistics
 * @access  Private (Manager, Admin, HR)
 */
router.get('/stats', performanceReviewController.getReviewStats);

/**
 * @route   GET /api/v1/performance-reviews/:id
 * @desc    Get single review by ID
 * @access  Private
 */
router.get('/:id', performanceReviewController.getReviewById);

/**
 * @route   POST /api/v1/performance-reviews
 * @desc    Create new performance review
 * @access  Private (Manager, Admin, HR)
 */
router.post('/', performanceReviewController.createReview);

/**
 * @route   PUT /api/v1/performance-reviews/:id
 * @desc    Update performance review
 * @access  Private (Reviewer, Admin, HR)
 */
router.put('/:id', performanceReviewController.updateReview);

/**
 * @route   POST /api/v1/performance-reviews/:id/acknowledge
 * @desc    Employee acknowledges review
 * @access  Private (Employee)
 */
router.post('/:id/acknowledge', performanceReviewController.acknowledgeReview);

/**
 * @route   DELETE /api/v1/performance-reviews/:id
 * @desc    Delete performance review
 * @access  Private (Admin, HR)
 */
router.delete('/:id', performanceReviewController.deleteReview);

module.exports = router;

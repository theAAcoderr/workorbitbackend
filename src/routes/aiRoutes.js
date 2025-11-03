const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/ai/capabilities
 * @desc    Get AI assistant capabilities
 * @access  Private
 */
router.get('/capabilities', aiController.getCapabilities);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Send message to AI assistant
 * @access  Private
 */
router.post('/chat', aiController.chat);

/**
 * @route   GET /api/v1/ai/suggestions
 * @desc    Get AI suggestions based on user context
 * @access  Private
 */
router.get('/suggestions', aiController.getSuggestions);

/**
 * @route   GET /api/v1/ai/history
 * @desc    Get chat history for current user
 * @access  Private
 */
router.get('/history', aiController.getChatHistory);

/**
 * @route   DELETE /api/v1/ai/history
 * @desc    Clear chat history
 * @access  Private
 */
router.delete('/history', aiController.clearChatHistory);

/**
 * @route   POST /api/v1/ai/analyze
 * @desc    Analyze data with AI
 * @access  Private
 */
router.post('/analyze', aiController.analyzeData);

module.exports = router;


/**
 * AI API Routes
 * Secure proxy endpoints for AI services
 *
 * All routes require authentication
 * Rate limiting applied per user
 */

const express = require('express');
const router = express.Router();
const aiProxyService = require('../services/ai-proxy.service');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Apply authentication to all AI routes
router.use(authenticate);

/**
 * Validation middleware for AI requests
 */
const validateAIRequest = [
  body('prompt').notEmpty().trim().isLength({ max: 10000 }),
  body('maxTokens').optional().isInt({ min: 1, max: 4000 }),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * @route   POST /api/v1/ai/perplexity
 * @desc    Proxy request to Perplexity AI
 * @access  Private
 */
router.post('/perplexity', validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;

    const payload = {
      model: 'pplx-7b-online',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature
    };

    const result = await aiProxyService.callPerplexity(userId, payload);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Perplexity proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request'
    });
  }
});

/**
 * @route   POST /api/v1/ai/google
 * @desc    Proxy request to Google AI (Gemini)
 * @access  Private
 */
router.post('/google', validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    };

    const result = await aiProxyService.callGoogleAI(userId, payload);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Google AI proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request'
    });
  }
});

/**
 * @route   POST /api/v1/ai/anthropic
 * @desc    Proxy request to Anthropic (Claude)
 * @access  Private
 */
router.post('/anthropic', validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;

    const payload = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature
    };

    const result = await aiProxyService.callAnthropic(userId, payload);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Anthropic proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request'
    });
  }
});

/**
 * @route   POST /api/v1/ai/openai
 * @desc    Proxy request to OpenAI
 * @access  Private
 */
router.post('/openai', validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, maxTokens = 1000, temperature = 0.7, model = 'gpt-3.5-turbo' } = req.body;

    const payload = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature
    };

    const result = await aiProxyService.callOpenAI(userId, payload);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('OpenAI proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request'
    });
  }
});

/**
 * @route   POST /api/v1/ai/deepseek
 * @desc    Proxy request to DeepSeek
 * @access  Private
 */
router.post('/deepseek', validateAIRequest, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;

    const payload = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature
    };

    const result = await aiProxyService.callDeepSeek(userId, payload);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('DeepSeek proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request'
    });
  }
});

/**
 * @route   GET /api/v1/ai/usage
 * @desc    Get AI usage statistics for current user
 * @access  Private
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const usage = aiProxyService.getUserUsage(userId);

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    logger.error('AI usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve usage statistics'
    });
  }
});

module.exports = router;

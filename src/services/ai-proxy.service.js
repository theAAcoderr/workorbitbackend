/**
 * AI Proxy Service
 * Securely proxies AI API calls to prevent exposing API keys in the mobile app
 *
 * SECURITY: All API keys are stored server-side only
 * Rate limiting and usage tracking implemented to prevent abuse
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AIProxyService {
  constructor() {
    // Load API keys from environment variables (server-side only)
    this.apiKeys = {
      perplexity: process.env.PERPLEXITY_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };

    // Validate required keys are present
    this.validateApiKeys();

    // Usage tracking (in production, use Redis or database)
    this.usageTracker = new Map();
  }

  validateApiKeys() {
    const missingKeys = [];
    Object.entries(this.apiKeys).forEach(([provider, key]) => {
      if (!key) {
        missingKeys.push(provider);
      }
    });

    if (missingKeys.length > 0) {
      logger.warn(`Missing API keys for providers: ${missingKeys.join(', ')}`);
    }
  }

  /**
   * Track API usage per user/organization
   * @param {string} userId - User ID
   * @param {string} provider - AI provider
   * @param {number} tokens - Tokens used (if applicable)
   */
  trackUsage(userId, provider, tokens = 0) {
    const key = `${userId}:${provider}`;
    const current = this.usageTracker.get(key) || { count: 0, tokens: 0 };
    this.usageTracker.set(key, {
      count: current.count + 1,
      tokens: current.tokens + tokens,
      lastUsed: new Date()
    });
  }

  /**
   * Check if user has exceeded usage limits
   * @param {string} userId - User ID
   * @param {string} provider - AI provider
   * @returns {boolean}
   */
  checkRateLimit(userId, provider) {
    const key = `${userId}:${provider}`;
    const usage = this.usageTracker.get(key);

    if (!usage) return true; // First request

    // Example: 100 requests per hour per user per provider
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (usage.lastUsed < hourAgo) {
      // Reset counter if more than an hour old
      this.usageTracker.delete(key);
      return true;
    }

    return usage.count < 100; // Configurable limit
  }

  /**
   * Proxy request to Perplexity AI
   */
  async callPerplexity(userId, payload) {
    if (!this.apiKeys.perplexity) {
      throw new Error('Perplexity API key not configured');
    }

    if (!this.checkRateLimit(userId, 'perplexity')) {
      throw new Error('Rate limit exceeded for Perplexity API');
    }

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.perplexity}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );

      this.trackUsage(userId, 'perplexity', response.data.usage?.total_tokens || 0);

      return response.data;
    } catch (error) {
      logger.error('Perplexity API error:', error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Proxy request to Google AI (Gemini)
   */
  async callGoogleAI(userId, payload) {
    if (!this.apiKeys.google) {
      throw new Error('Google AI API key not configured');
    }

    if (!this.checkRateLimit(userId, 'google')) {
      throw new Error('Rate limit exceeded for Google AI');
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKeys.google}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      this.trackUsage(userId, 'google');
      return response.data;
    } catch (error) {
      logger.error('Google AI error:', error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Proxy request to Anthropic (Claude)
   */
  async callAnthropic(userId, payload) {
    if (!this.apiKeys.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    if (!this.checkRateLimit(userId, 'anthropic')) {
      throw new Error('Rate limit exceeded for Anthropic API');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        payload,
        {
          headers: {
            'x-api-key': this.apiKeys.anthropic,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      this.trackUsage(userId, 'anthropic', response.data.usage?.total_tokens || 0);
      return response.data;
    } catch (error) {
      logger.error('Anthropic API error:', error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Proxy request to OpenAI
   */
  async callOpenAI(userId, payload) {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    if (!this.checkRateLimit(userId, 'openai')) {
      throw new Error('Rate limit exceeded for OpenAI');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.openai}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      this.trackUsage(userId, 'openai', response.data.usage?.total_tokens || 0);
      return response.data;
    } catch (error) {
      logger.error('OpenAI API error:', error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Proxy request to DeepSeek
   */
  async callDeepSeek(userId, payload) {
    if (!this.apiKeys.deepseek) {
      throw new Error('DeepSeek API key not configured');
    }

    if (!this.checkRateLimit(userId, 'deepseek')) {
      throw new Error('Rate limit exceeded for DeepSeek');
    }

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.deepseek}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      this.trackUsage(userId, 'deepseek', response.data.usage?.total_tokens || 0);
      return response.data;
    } catch (error) {
      logger.error('DeepSeek API error:', error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Get usage statistics for a user
   */
  getUserUsage(userId) {
    const stats = {};
    this.usageTracker.forEach((value, key) => {
      if (key.startsWith(userId + ':')) {
        const provider = key.split(':')[1];
        stats[provider] = value;
      }
    });
    return stats;
  }
}

module.exports = new AIProxyService();

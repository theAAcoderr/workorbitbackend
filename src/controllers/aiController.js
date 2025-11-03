const { User } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

/**
 * AI Assistant Controller with Perplexity API Integration
 *
 * Integrated with Perplexity AI for intelligent responses
 * Falls back to rule-based responses if API is unavailable
 */

// In-memory chat history (replace with database in production)
const chatHistories = new Map();

// Perplexity API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = process.env.PERPLEXITY_API_URL || 'https://api.perplexity.ai';
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || 'sonar-pro';
const AI_ENABLED = process.env.ENABLE_AI_FEATURES === 'true' && PERPLEXITY_API_KEY;

console.log('🤖 AI Controller initialized');
console.log('   AI Enabled:', AI_ENABLED);
console.log('   Perplexity API Key:', PERPLEXITY_API_KEY ? '✓ Configured' : '✗ Missing');

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Send message to AI assistant
 * @access  Private
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get or create chat history for user
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, []);
    }

    const history = chatHistories.get(userId);

    // Add user message to history
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Generate AI response with Perplexity API
    const aiResponse = await _generateResponse(message, context, req.user, history);

    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    res.json({
      success: true,
      data: {
        response: aiResponse,
        message: aiResponse,
        context: context || 'general',
        timestamp: new Date(),
        provider: AI_ENABLED ? 'Perplexity AI' : 'Rule-based'
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/ai/suggestions
 * @desc    Get AI suggestions based on user context
 * @access  Private
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const { context } = req.query;
    const user = req.user;

    const suggestions = await _generateSuggestions(context, user);

    res.json({
      success: true,
      data: {
        suggestions: suggestions
      }
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/ai/history
 * @desc    Get chat history for current user
 * @access  Private
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const history = chatHistories.get(userId) || [];
    const recentHistory = history.slice(-parseInt(limit));

    res.json({
      success: true,
      count: recentHistory.length,
      data: {
        history: recentHistory
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/ai/history
 * @desc    Clear chat history
 * @access  Private
 */
exports.clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    chatHistories.delete(userId);

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/v1/ai/analyze
 * @desc    Analyze data with AI
 * @access  Private
 */
exports.analyzeData = async (req, res, next) => {
  try {
    const { dataType, data, analysisType } = req.body;

    if (!dataType || !data) {
      return res.status(400).json({
        success: false,
        message: 'Data type and data are required'
      });
    }

    const analysis = await _performAnalysis(dataType, data, analysisType);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze data error:', error);
    next(error);
  }
};

// ============= HELPER FUNCTIONS =============

/**
 * Generate AI response using Perplexity API or fallback to rule-based
 */
async function _generateResponse(message, context, user, history) {
  // Try Perplexity AI if enabled
  if (AI_ENABLED) {
    try {
      return await _callPerplexityAPI(message, context, user, history);
    } catch (error) {
      console.error('❌ Perplexity API error:', error.message);
      console.log('   Falling back to rule-based responses');
    }
  }

  // Fallback to rule-based responses
  return _generateRuleBasedResponse(message, context, user);
}

/**
 * Call Perplexity API for AI-powered responses
 */
async function _callPerplexityAPI(message, context, user, history) {
  console.log('🤖 Calling Perplexity API...');

  const systemPrompt = `You are an AI assistant for WorkOrbit, an HR and workforce management system.
You help employees and managers with:
- Attendance tracking and check-in/check-out
- Leave management and applications
- Payroll information and payslips
- Meeting scheduling
- Task and project management
- HR policies and procedures

Context: ${context || 'general'}
User: ${user.name} (${user.role || 'employee'})

Provide helpful, concise, and professional responses. Be friendly but professional.`;

  const messages = [{ role: 'system', content: systemPrompt }];

  // Add recent history for context (last 10 messages, excluding the current message)
  // The history already contains the current user message, so we need to exclude it
  if (history && Array.isArray(history) && history.length > 0) {
    // Get history without the last message (which is the current message just added)
    const previousHistory = history.slice(0, -1).slice(-10);

    previousHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Add the current user message
  messages.push({ role: 'user', content: message });

  const requestBody = {
    model: PERPLEXITY_MODEL,
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  };

  console.log('📤 Request Details:');
  console.log('   URL:', `${PERPLEXITY_API_URL}/chat/completions`);
  console.log('   Model:', requestBody.model);
  console.log('   Messages count:', requestBody.messages.length);
  console.log('   User message:', message);

  try {
    const response = await axios.post(
      `${PERPLEXITY_API_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      console.log('✅ Perplexity API response received');
      return response.data.choices[0].message.content;
    }

    throw new Error('Invalid response from Perplexity API');
  } catch (error) {
    console.error('❌ Perplexity API Error Details:');
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Messages sent:', JSON.stringify(requestBody.messages.map(m => ({ role: m.role, length: m.content.length })), null, 2));
    throw error;
  }
}

/**
 * Generate rule-based response (fallback)
 */
function _generateRuleBasedResponse(message, context, user) {
  const messageLower = message.toLowerCase();

  // Context-aware responses
  if (context === 'attendance') {
    if (messageLower.includes('check in') || messageLower.includes('check-in')) {
      return "To check in, go to your dashboard and tap the 'Check In' button. Make sure you're within the designated geofence area.";
    }
    if (messageLower.includes('late')) {
      return "If you're running late, please inform your manager immediately. You can also check your attendance history in the Reports section.";
    }
  }

  if (context === 'leave') {
    if (messageLower.includes('apply') || messageLower.includes('request')) {
      return "To apply for leave, go to Leave → Apply Leave. Fill in the required details including dates, leave type, and reason. Your manager will receive a notification.";
    }
    if (messageLower.includes('balance')) {
      return "You can check your leave balance in the Leave Dashboard. It shows available days for each leave type.";
    }
  }

  if (context === 'payroll') {
    if (messageLower.includes('payslip') || messageLower.includes('salary')) {
      return "Your payslips are available in Payroll → My Payslips. You can view and download them anytime.";
    }
  }

  // General help responses
  if (messageLower.includes('help') || messageLower.includes('how')) {
    return `Hello ${user.name}! I can help you with:

• Attendance: Check in/out, view history, track location
• Leave: Apply, check balance, view policies
• Payroll: View payslips, check salary details
• Meetings: Schedule, join, view upcoming meetings
• Projects: View tasks, update progress, track deadlines

What would you like to know more about?`;
  }

  // Default response
  return "I'm here to help! You can ask me about attendance, leave, payroll, meetings, or projects. What would you like to know?";
}

/**
 * Generate contextual suggestions
 */
async function _generateSuggestions(context, user) {
  const baseSuggestions = {
    general: [
      { id: 1, text: 'How do I check in?', category: 'attendance' },
      { id: 2, text: 'Apply for leave', category: 'leave' },
      { id: 3, text: 'View my payslip', category: 'payroll' },
      { id: 4, text: 'Schedule a meeting', category: 'meetings' },
      { id: 5, text: 'Check my tasks', category: 'projects' },
    ],
    attendance: [
      { id: 1, text: 'How do I check in?', category: 'attendance' },
      { id: 2, text: 'View my attendance history', category: 'attendance' },
      { id: 3, text: "What if I'm running late?", category: 'attendance' },
      { id: 4, text: 'Check geofence locations', category: 'attendance' },
    ],
    leave: [
      { id: 1, text: 'How do I apply for leave?', category: 'leave' },
      { id: 2, text: 'Check my leave balance', category: 'leave' },
      { id: 3, text: 'View leave policies', category: 'leave' },
      { id: 4, text: 'Cancel a leave request', category: 'leave' },
    ],
    payroll: [
      { id: 1, text: 'Where can I see my payslip?', category: 'payroll' },
      { id: 2, text: 'View salary breakdown', category: 'payroll' },
      { id: 3, text: 'When is payday?', category: 'payroll' },
      { id: 4, text: 'Update bank details', category: 'payroll' },
    ],
  };

  return baseSuggestions[context] || baseSuggestions.general;
}

/**
 * Perform data analysis
 */
async function _performAnalysis(dataType, data, analysisType) {
  // Basic analysis implementation
  // TODO: Integrate with actual AI/ML service

  const results = {
    dataType,
    analysisType: analysisType || 'summary',
    timestamp: new Date(),
    insights: []
  };

  if (dataType === 'attendance') {
    // Attendance analysis
    results.insights = [
      { type: 'trend', message: 'Consistent attendance pattern detected' },
      { type: 'suggestion', message: 'Consider enabling automatic check-in reminders' },
    ];
  } else if (dataType === 'leave') {
    // Leave analysis
    results.insights = [
      { type: 'trend', message: 'Leave usage within normal range' },
      { type: 'suggestion', message: 'Plan leaves in advance for better approval rates' },
    ];
  } else if (dataType === 'performance') {
    // Performance analysis
    results.insights = [
      { type: 'trend', message: 'Steady performance improvement' },
      { type: 'suggestion', message: 'Continue current work patterns' },
    ];
  }

  return results;
}

/**
 * Get AI capabilities
 */
exports.getCapabilities = async (req, res, next) => {
  try {
    const capabilities = {
      chat: {
        enabled: true,
        description: 'Interactive chat with AI assistant',
        contexts: ['general', 'attendance', 'leave', 'payroll', 'meetings', 'projects']
      },
      suggestions: {
        enabled: true,
        description: 'Context-aware suggestions',
        types: ['quick-actions', 'help-topics', 'shortcuts']
      },
      analysis: {
        enabled: true,
        description: 'Data analysis and insights',
        dataTypes: ['attendance', 'leave', 'performance', 'productivity']
      },
      automation: {
        enabled: false,
        description: 'Automated tasks (coming soon)',
        note: 'Requires AI service integration'
      }
    };

    res.json({
      success: true,
      data: capabilities,
      provider: 'WorkOrbit AI (Basic)',
      version: '1.0',
      note: 'Integrate OpenAI/Google AI/Azure AI for advanced features'
    });
  } catch (error) {
    console.error('Get AI capabilities error:', error);
    next(error);
  }
};

module.exports = exports;


const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * AI Assistant Controller
 * 
 * This is a basic implementation that can be extended with actual AI services
 * (OpenAI, Google AI, Azure AI, etc.)
 * 
 * For now, it provides a structured response framework that can be integrated
 * with AI services later.
 */

// In-memory chat history (replace with database in production)
const chatHistories = new Map();

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

    // Generate AI response (basic implementation)
    const aiResponse = await _generateResponse(message, context, req.user);

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
        message: aiResponse,
        context: context || 'general',
        timestamp: new Date()
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
      data: suggestions
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
      data: recentHistory
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
 * Generate AI response (basic implementation)
 * TODO: Integrate with actual AI service (OpenAI, etc.)
 */
async function _generateResponse(message, context, user) {
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


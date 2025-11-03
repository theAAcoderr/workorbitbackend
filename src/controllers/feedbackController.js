const { Feedback, User, Organization } = require('../models');
const { Op } = require('sequelize');

/**
 * Create new feedback
 * @route POST /api/v1/feedback
 * @access Private - All authenticated users
 */
exports.createFeedback = async (req, res) => {
  try {
    const { title, message, type, rating, recipientId, visibility, isAnonymous } = req.body;
    const submitterId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate that recipient exists and is in the same organization
    const recipient = await User.findOne({
      where: {
        id: recipientId,
        organizationId: organizationId
      }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or not in your organization'
      });
    }

    // Prevent self-feedback
    if (submitterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot give feedback to yourself'
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      title,
      message,
      type: type || 'general',
      rating,
      submitterId,
      recipientId,
      organizationId,
      visibility: visibility || 'private',
      isAnonymous: isAnonymous || false
    });

    // Fetch the created feedback with associations
    const createdFeedback = await Feedback.findByPk(feedback.id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: createdFeedback
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

/**
 * Get all feedback (filtered by role)
 * @route GET /api/v1/feedback
 * @access Private - Role-based access
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;
    const { type, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { organizationId };

    // Add filters if provided
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    // Role-based access control
    let feedbackQuery;

    if (userRole === 'admin' || userRole === 'hr') {
      // Admin and HR can see all feedback in the organization
      feedbackQuery = whereClause;
    } else if (userRole === 'manager') {
      // Managers can see:
      // 1. Feedback they submitted
      // 2. Feedback they received
      // 3. Feedback involving their team members
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(sub => sub.id);

      feedbackQuery = {
        ...whereClause,
        [Op.or]: [
          { submitterId: userId },
          { recipientId: userId },
          { submitterId: { [Op.in]: subordinateIds } },
          { recipientId: { [Op.in]: subordinateIds } }
        ]
      };
    } else {
      // Employees can only see feedback they submitted or received
      feedbackQuery = {
        ...whereClause,
        [Op.or]: [
          { submitterId: userId },
          { recipientId: userId }
        ]
      };
    }

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: feedbackQuery,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback submitted by the current user
 * @route GET /api/v1/feedback/sent
 * @access Private
 */
exports.getSentFeedback = async (req, res) => {
  try {
    const submitterId = req.user.id;
    const { type, status, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { submitterId };

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sent feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback received by the current user
 * @route GET /api/v1/feedback/received
 * @access Private
 */
exports.getReceivedFeedback = async (req, res) => {
  try {
    const recipientId = req.user.id;
    const { type, status, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { recipientId };

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching received feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback for team members (Manager only)
 * @route GET /api/v1/feedback/team
 * @access Private - Manager, HR, Admin only
 */
exports.getTeamFeedback = async (req, res) => {
  try {
    const managerId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;
    const { type, status, page = 1, limit = 20 } = req.query;

    // Only managers, HR, and admins can access this
    if (!['manager', 'hr', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers, HR, and admins can view team feedback.'
      });
    }

    const offset = (page - 1) * limit;
    let whereClause = {};

    if (userRole === 'manager') {
      // Get manager's subordinates
      const subordinates = await User.findAll({
        where: { managerId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(sub => sub.id);

      if (subordinateIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            pages: 0,
            limit: parseInt(limit)
          }
        });
      }

      whereClause = {
        organizationId,
        [Op.or]: [
          { submitterId: { [Op.in]: subordinateIds } },
          { recipientId: { [Op.in]: subordinateIds } }
        ]
      };
    } else {
      // HR and Admin can see all feedback in the organization
      whereClause = { organizationId };
    }

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching team feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback for a specific team member (Manager only)
 * @route GET /api/v1/feedback/team/:userId
 * @access Private - Manager, HR, Admin only
 */
exports.getTeamMemberFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    const managerId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;
    const { type, status, page = 1, limit = 20 } = req.query;

    // Only managers, HR, and admins can access this
    if (!['manager', 'hr', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers, HR, and admins can view team member feedback.'
      });
    }

    // Verify the user exists and is in the same organization
    const targetUser = await User.findOne({
      where: {
        id: userId,
        organizationId
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your organization'
      });
    }

    // For managers, verify the user is their subordinate
    if (userRole === 'manager' && targetUser.managerId !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view feedback for your direct reports'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      organizationId,
      [Op.or]: [
        { submitterId: userId },
        { recipientId: userId }
      ]
    };

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: feedbacks,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        department: targetUser.department,
        designation: targetUser.designation
      },
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching team member feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team member feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback by ID
 * @route GET /api/v1/feedback/:id
 * @access Private - Must be submitter, recipient, or authorized role
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const feedback = await Feedback.findByPk(id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ]
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check access permissions
    const isSubmitter = feedback.submitterId === userId;
    const isRecipient = feedback.recipientId === userId;
    const isAuthorized = ['admin', 'hr'].includes(userRole);
    const isManager = userRole === 'manager';

    let hasAccess = isSubmitter || isRecipient || isAuthorized;

    // For managers, check if feedback involves their team members
    if (isManager && !hasAccess) {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      hasAccess = subordinateIds.includes(feedback.submitterId) || subordinateIds.includes(feedback.recipientId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this feedback'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

/**
 * Update feedback
 * @route PUT /api/v1/feedback/:id
 * @access Private - Only submitter can update (within 24 hours)
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, message, type, rating, visibility, isAnonymous } = req.body;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only the submitter can update their own feedback
    if (feedback.submitterId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback'
      });
    }

    // Check if feedback was created within 24 hours
    const createdAt = new Date(feedback.createdAt);
    const now = new Date();
    const hoursDifference = (now - createdAt) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      return res.status(403).json({
        success: false,
        message: 'Feedback can only be edited within 24 hours of submission'
      });
    }

    // Update only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (rating !== undefined) updateData.rating = rating;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;

    await feedback.update(updateData);

    // Fetch updated feedback with associations
    const updatedFeedback = await Feedback.findByPk(id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
};

/**
 * Acknowledge feedback
 * @route POST /api/v1/feedback/:id/acknowledge
 * @access Private - Only recipient can acknowledge
 */
exports.acknowledgeFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only the recipient can acknowledge feedback
    if (feedback.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can acknowledge this feedback'
      });
    }

    // Check if already acknowledged
    if (feedback.status === 'acknowledged') {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been acknowledged'
      });
    }

    await feedback.acknowledge();

    // Fetch updated feedback with associations
    const acknowledgedFeedback = await Feedback.findByPk(id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Feedback acknowledged successfully',
      data: acknowledgedFeedback
    });
  } catch (error) {
    console.error('Error acknowledging feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging feedback',
      error: error.message
    });
  }
};

/**
 * Archive feedback
 * @route POST /api/v1/feedback/:id/archive
 * @access Private - Recipient or authorized roles
 */
exports.archiveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check permissions: recipient, admin, or HR can archive
    const isRecipient = feedback.recipientId === userId;
    const isAuthorized = ['admin', 'hr'].includes(userRole);

    if (!isRecipient && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to archive this feedback'
      });
    }

    await feedback.archive();

    // Fetch updated feedback with associations
    const archivedFeedback = await Feedback.findByPk(id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'department', 'designation', 'profilePicture']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Feedback archived successfully',
      data: archivedFeedback
    });
  } catch (error) {
    console.error('Error archiving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving feedback',
      error: error.message
    });
  }
};

/**
 * Delete feedback
 * @route DELETE /api/v1/feedback/:id
 * @access Private - Submitter (within 24h) or Admin/HR
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const isSubmitter = feedback.submitterId === userId;
    const isAuthorized = ['admin', 'hr'].includes(userRole);

    // Submitters can only delete within 24 hours
    if (isSubmitter && !isAuthorized) {
      const createdAt = new Date(feedback.createdAt);
      const now = new Date();
      const hoursDifference = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDifference > 24) {
        return res.status(403).json({
          success: false,
          message: 'Feedback can only be deleted within 24 hours of submission'
        });
      }
    }

    // Only submitter or authorized roles can delete
    if (!isSubmitter && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this feedback'
      });
    }

    await feedback.destroy();

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback statistics
 * @route GET /api/v1/feedback/stats
 * @access Private - All authenticated users
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    let statsQuery = { organizationId };

    // For employees, only show their own stats
    if (userRole === 'employee') {
      const sentCount = await Feedback.count({
        where: { submitterId: userId }
      });

      const receivedCount = await Feedback.count({
        where: { recipientId: userId }
      });

      const acknowledgedCount = await Feedback.count({
        where: {
          recipientId: userId,
          status: 'acknowledged'
        }
      });

      const pendingCount = await Feedback.count({
        where: {
          recipientId: userId,
          status: 'pending'
        }
      });

      return res.json({
        success: true,
        data: {
          sent: sentCount,
          received: receivedCount,
          acknowledged: acknowledgedCount,
          pending: pendingCount
        }
      });
    }

    // For managers, HR, and admins - show organization-wide stats
    const totalFeedback = await Feedback.count({
      where: statsQuery
    });

    const positiveCount = await Feedback.count({
      where: { ...statsQuery, type: 'positive' }
    });

    const constructiveCount = await Feedback.count({
      where: { ...statsQuery, type: 'constructive' }
    });

    const generalCount = await Feedback.count({
      where: { ...statsQuery, type: 'general' }
    });

    const acknowledgedCount = await Feedback.count({
      where: { ...statsQuery, status: 'acknowledged' }
    });

    const pendingCount = await Feedback.count({
      where: { ...statsQuery, status: 'pending' }
    });

    res.json({
      success: true,
      data: {
        total: totalFeedback,
        byType: {
          positive: positiveCount,
          constructive: constructiveCount,
          general: generalCount
        },
        byStatus: {
          acknowledged: acknowledgedCount,
          pending: pendingCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback statistics',
      error: error.message
    });
  }
};

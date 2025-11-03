const PerformanceReview = require('../models/PerformanceReview');
const { User } = require('../models');
const { Op } = require('sequelize');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

/**
 * Get all performance reviews for current user
 * @route GET /api/v1/performance-reviews
 * @access Private
 */
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const { status, period, page = 1, limit = 20 } = req.query;

    const whereClause = {
      organizationId
    };

    // Regular users see their own reviews
    // Managers/HR see reviews they created or all in organization
    if (userRole === 'employee') {
      whereClause.employeeId = userId;
    } else if (userRole === 'manager') {
      whereClause[Op.or] = [
        { employeeId: userId },
        { reviewerId: userId }
      ];
    }
    // Admin and HR can see all

    // Apply filters
    if (status) whereClause.status = status;
    if (period) whereClause.reviewPeriod = period;

    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await PerformanceReview.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department', 'designation']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['reviewDate', 'DESC']]
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * Get single review by ID
 * @route GET /api/v1/performance-reviews/:id
 * @access Private
 */
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const review = await PerformanceReview.findOne({
      where: {
        id,
        organizationId
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department', 'designation']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email', 'profilePicture', 'department']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check access permissions
    const hasAccess =
      userRole === 'admin' ||
      userRole === 'hr' ||
      review.employeeId === userId ||
      review.reviewerId === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

/**
 * Create new performance review
 * @route POST /api/v1/performance-reviews
 * @access Private (Manager, Admin, HR)
 */
exports.createReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    // Only managers, HR, and admin can create reviews
    if (!['manager', 'admin', 'hr'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers and HR can create performance reviews'
      });
    }

    const {
      employeeId,
      title,
      reviewPeriod,
      reviewDate,
      ratings,
      strengths,
      areasForImprovement,
      comments,
      goals,
      overallScore
    } = req.body;

    // Verify employee exists and belongs to organization
    const employee = await User.findOne({
      where: { id: employeeId, organizationId }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate overall score if not provided
    let calculatedScore = overallScore;
    if (!calculatedScore && ratings && Object.keys(ratings).length > 0) {
      const scores = Object.values(ratings);
      calculatedScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    const review = await PerformanceReview.create({
      employeeId,
      reviewerId,
      organizationId,
      title,
      reviewPeriod,
      reviewDate: reviewDate || new Date(),
      ratings: ratings || {},
      strengths,
      areasForImprovement,
      comments,
      goals: goals || [],
      overallScore: calculatedScore,
      status: 'draft'
    });

    const createdReview = await PerformanceReview.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });

    // 🔔 ADMIN NOTIFICATION: Low performance score check (threshold: 2.5 out of 5)
    const LOW_SCORE_THRESHOLD = 2.5;
    if (calculatedScore && calculatedScore < LOW_SCORE_THRESHOLD) {
      await adminNotificationService.notifyLowPerformanceScore(
        organizationId,
        {
          employeeId: employeeId,
          employeeName: employee.name,
          score: calculatedScore,
          reviewer: req.user.name,
          threshold: LOW_SCORE_THRESHOLD
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    // Send notification to employee about performance review assignment
    try {
      await oneSignalService.sendToUser(
        employeeId.toString(),
        {
          title: '📊 Performance Review Assigned',
          message: `${req.user.name} has assigned you a performance review: ${title}`,
          data: {
            type: 'performance_review_assigned',
            reviewId: review.id,
            title: title,
            reviewPeriod: reviewPeriod,
            reviewDate: reviewDate || new Date(),
            reviewerName: req.user.name,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Performance review assignment notification sent to employee ${employeeId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send performance review assignment notification:', notificationError);
      // Don't fail the review creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: createdReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

/**
 * Update performance review
 * @route PUT /api/v1/performance-reviews/:id
 * @access Private (Reviewer, Admin, HR)
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const review = await PerformanceReview.findOne({
      where: { id, organizationId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only reviewer, admin, or HR can update
    if (review.reviewerId !== userId && !['admin', 'hr'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewer can update this review'
      });
    }

    const {
      title,
      reviewPeriod,
      reviewDate,
      ratings,
      strengths,
      areasForImprovement,
      comments,
      goals,
      overallScore,
      status
    } = req.body;

    // Calculate overall score if ratings changed
    let calculatedScore = overallScore;
    if (ratings && Object.keys(ratings).length > 0 && !overallScore) {
      const scores = Object.values(ratings);
      calculatedScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (reviewPeriod !== undefined) updateData.reviewPeriod = reviewPeriod;
    if (reviewDate !== undefined) updateData.reviewDate = reviewDate;
    if (ratings !== undefined) updateData.ratings = ratings;
    if (strengths !== undefined) updateData.strengths = strengths;
    if (areasForImprovement !== undefined) updateData.areasForImprovement = areasForImprovement;
    if (comments !== undefined) updateData.comments = comments;
    if (goals !== undefined) updateData.goals = goals;
    if (calculatedScore !== undefined) updateData.overallScore = calculatedScore;
    if (status !== undefined) updateData.status = status;

    await review.update(updateData);

    const updatedReview = await PerformanceReview.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });

    // Send notification when review is completed
    if (status === 'completed' && review.status !== 'completed') {
      try {
        await oneSignalService.sendToUser(
          review.employeeId.toString(),
          {
            title: '✅ Performance Review Completed',
            message: `Your performance review "${updatedReview.title}" has been completed by ${req.user.name}`,
            data: {
              type: 'performance_review_completed',
              reviewId: review.id,
              title: updatedReview.title,
              overallScore: calculatedScore,
              reviewerName: req.user.name,
              timestamp: new Date().toISOString()
            }
          }
        );
        console.log(`✅ Performance review completion notification sent to employee ${review.employeeId}`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send performance review completion notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * Employee acknowledges review
 * @route POST /api/v1/performance-reviews/:id/acknowledge
 * @access Private (Employee)
 */
exports.acknowledgeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { employeeComments } = req.body;

    const review = await PerformanceReview.findOne({
      where: { id, organizationId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only the employee can acknowledge their review
    if (review.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the employee can acknowledge this review'
      });
    }

    await review.update({
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      employeeComments: employeeComments || null
    });

    res.json({
      success: true,
      message: 'Review acknowledged successfully',
      data: review
    });
  } catch (error) {
    console.error('Error acknowledging review:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging review',
      error: error.message
    });
  }
};

/**
 * Delete performance review
 * @route DELETE /api/v1/performance-reviews/:id
 * @access Private (Admin, HR)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    // Only admin and HR can delete
    if (!['admin', 'hr'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete reviews'
      });
    }

    const review = await PerformanceReview.findOne({
      where: { id, organizationId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

/**
 * Get review statistics
 * @route GET /api/v1/performance-reviews/stats
 * @access Private (Manager, Admin, HR)
 */
exports.getReviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    if (!['manager', 'admin', 'hr'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const whereClause = { organizationId };
    if (userRole === 'manager') {
      whereClause.reviewerId = userId;
    }

    const totalReviews = await PerformanceReview.count({ where: whereClause });
    const pendingReviews = await PerformanceReview.count({
      where: { ...whereClause, status: 'pending' }
    });
    const completedReviews = await PerformanceReview.count({
      where: { ...whereClause, status: 'completed' }
    });
    const averageScore = await PerformanceReview.findOne({
      where: whereClause,
      attributes: [[sequelize.fn('AVG', sequelize.col('overallScore')), 'avgScore']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalReviews,
        pendingReviews,
        completedReviews,
        averageScore: averageScore?.avgScore || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = exports;

const { Course, CourseEnrollment, User, Organization } = require('../models');
const { Op } = require('sequelize');
const oneSignalService = require('../services/oneSignalService');

/**
 * Get all courses with user's enrollment status
 * @route GET /api/v1/training/courses
 */
exports.getCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, level, search } = req.query;

    // Build where clause
    const whereClause = { isActive: true };

    if (category) {
      whereClause.category = category;
    }

    if (level) {
      whereClause.level = level;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get all courses
    const courses = await Course.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: CourseEnrollment,
          as: 'enrollments',
          where: { userId },
          required: false,
          attributes: ['id', 'status', 'progress', 'enrolledAt', 'completedAt', 'score', 'rating']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform data to match Flutter expectations
    const transformedCourses = courses.map(course => {
      const courseData = course.toJSON();
      const enrollment = courseData.enrollments && courseData.enrollments.length > 0
        ? courseData.enrollments[0]
        : null;

      return {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        duration: courseData.duration,
        level: courseData.level,
        content: courseData.content, // Include content field with modules/lessons
        thumbnailUrl: courseData.thumbnailUrl,
        videoUrl: courseData.videoUrl,
        materialUrl: courseData.materialUrl,
        certificateTemplate: courseData.certificateTemplate,
        isActive: courseData.isActive,
        organizationId: courseData.organizationId,
        createdBy: courseData.createdBy,
        instructorName: courseData.instructorName,
        maxEnrollments: courseData.maxEnrollments,
        createdAt: courseData.createdAt,
        updatedAt: courseData.updatedAt,
        // Enrollment information
        enrolled: enrollment !== null,
        enrollmentId: enrollment ? enrollment.id : null,
        status: enrollment ? enrollment.status : null,
        progress: enrollment ? enrollment.progress : 0,
        enrolledAt: enrollment ? enrollment.enrolledAt : null,
        completedAt: enrollment ? enrollment.completedAt : null,
        completedDate: enrollment && enrollment.completedAt
          ? new Date(enrollment.completedAt).toLocaleDateString()
          : null,
        score: enrollment ? enrollment.score : null,
        rating: enrollment ? enrollment.rating : null
      };
    });

    res.json({
      success: true,
      data: transformedCourses,
      message: 'Courses fetched successfully'
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

/**
 * Get single course details
 * @route GET /api/v1/training/courses/:id
 */
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: CourseEnrollment,
          as: 'enrollments',
          where: { userId },
          required: false
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const courseData = course.toJSON();
    const enrollment = courseData.enrollments && courseData.enrollments.length > 0
      ? courseData.enrollments[0]
      : null;

    res.json({
      success: true,
      data: {
        ...courseData,
        enrolled: enrollment !== null,
        enrollmentId: enrollment ? enrollment.id : null,
        enrollmentStatus: enrollment ? enrollment.status : null,
        progress: enrollment ? enrollment.progress : 0
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message
    });
  }
};

/**
 * Create new course (Admin/Manager only)
 * @route POST /api/v1/training/courses
 */
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Check if user has permission
    if (!['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create courses'
      });
    }

    const {
      title,
      description,
      category,
      duration,
      level,
      content,
      thumbnailUrl,
      videoUrl,
      materialUrl,
      certificateTemplate,
      instructorName,
      maxEnrollments
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }

    const course = await Course.create({
      title,
      description,
      category,
      duration,
      level: level || 'beginner',
      content,
      thumbnailUrl,
      videoUrl,
      materialUrl,
      certificateTemplate,
      instructorName,
      maxEnrollments,
      organizationId,
      createdBy: userId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
};

/**
 * Update course (Admin/Manager only)
 * @route PUT /api/v1/training/courses/:id
 */
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission
    if (!['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update courses'
      });
    }

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const {
      title,
      description,
      category,
      duration,
      level,
      content,
      thumbnailUrl,
      videoUrl,
      materialUrl,
      certificateTemplate,
      instructorName,
      maxEnrollments,
      isActive
    } = req.body;

    await course.update({
      title: title || course.title,
      description: description !== undefined ? description : course.description,
      category: category !== undefined ? category : course.category,
      duration: duration !== undefined ? duration : course.duration,
      level: level || course.level,
      content: content !== undefined ? content : course.content,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : course.thumbnailUrl,
      videoUrl: videoUrl !== undefined ? videoUrl : course.videoUrl,
      materialUrl: materialUrl !== undefined ? materialUrl : course.materialUrl,
      certificateTemplate: certificateTemplate !== undefined ? certificateTemplate : course.certificateTemplate,
      instructorName: instructorName !== undefined ? instructorName : course.instructorName,
      maxEnrollments: maxEnrollments !== undefined ? maxEnrollments : course.maxEnrollments,
      isActive: isActive !== undefined ? isActive : course.isActive
    });

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
};

/**
 * Delete course (Admin only)
 * @route DELETE /api/v1/training/courses/:id
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete courses'
      });
    }

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Soft delete - just mark as inactive
    await course.update({ isActive: false });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
};

/**
 * Enroll user in course
 * @route POST /api/v1/training/courses/:id/enroll
 */
exports.enrollInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: { courseId, userId }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Check max enrollments
    if (course.maxEnrollments) {
      const enrollmentCount = await CourseEnrollment.count({
        where: { courseId }
      });

      if (enrollmentCount >= course.maxEnrollments) {
        return res.status(400).json({
          success: false,
          message: 'This course has reached maximum enrollment capacity'
        });
      }
    }

    // Create enrollment
    const enrollment = await CourseEnrollment.create({
      courseId,
      userId,
      status: 'enrolled',
      progress: 0,
      enrolledAt: new Date()
    });

    // Send notification to user about successful enrollment
    try {
      await oneSignalService.sendToUser(
        userId.toString(),
        {
          title: '📚 Course Enrollment Successful',
          message: `You have successfully enrolled in "${course.title}"`,
          data: {
            type: 'course_enrolled',
            courseId: course.id,
            courseTitle: course.title,
            enrollmentId: enrollment.id,
            duration: course.duration,
            level: course.level,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Course enrollment notification sent to user ${userId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send course enrollment notification:', notificationError);
      // Don't fail the enrollment if notification fails
    }

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
};

/**
 * Update enrollment progress
 * @route PUT /api/v1/training/enrollments/:id/progress
 */
exports.updateProgress = async (req, res) => {
  try {
    const { id: enrollmentId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    const enrollment = await CourseEnrollment.findOne({
      where: { id: enrollmentId, userId }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Validate progress
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    // Update enrollment
    const updates = {
      progress,
      lastAccessedAt: new Date()
    };

    // If starting the course
    if (enrollment.status === 'enrolled' && progress > 0) {
      updates.status = 'in_progress';
      updates.startedAt = new Date();
    }

    // If completing the course
    if (progress === 100 && enrollment.status !== 'completed') {
      updates.status = 'completed';
      updates.completedAt = new Date();
    }

    await enrollment.update(updates);

    res.json({
      success: true,
      data: enrollment,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

/**
 * Complete course and submit feedback
 * @route POST /api/v1/training/enrollments/:id/complete
 */
exports.completeCourse = async (req, res) => {
  try {
    const { id: enrollmentId } = req.params;
    const { score, feedback, rating } = req.body;
    const userId = req.user.id;

    const enrollment = await CourseEnrollment.findOne({
      where: { id: enrollmentId, userId },
      include: [{ model: Course, as: 'course' }]
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update enrollment
    await enrollment.update({
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      score: score || enrollment.score,
      feedback: feedback || enrollment.feedback,
      rating: rating || enrollment.rating
    });

    // Send notification to user about course completion
    try {
      await oneSignalService.sendToUser(
        userId.toString(),
        {
          title: '🎓 Course Completed!',
          message: `Congratulations! You have completed "${enrollment.course.title}"`,
          data: {
            type: 'course_completed',
            courseId: enrollment.courseId,
            courseTitle: enrollment.course.title,
            enrollmentId: enrollment.id,
            score: score || enrollment.score,
            completedAt: new Date(),
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Course completion notification sent to user ${userId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send course completion notification:', notificationError);
      // Don't fail the completion if notification fails
    }

    res.json({
      success: true,
      data: enrollment,
      message: 'Course completed successfully'
    });
  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete course',
      error: error.message
    });
  }
};

/**
 * Get user's enrollments
 * @route GET /api/v1/training/enrollments
 */
exports.getEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    const enrollments = await CourseEnrollment.findAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'category', 'duration', 'level', 'thumbnailUrl']
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
};

/**
 * Drop/Unenroll from course
 * @route DELETE /api/v1/training/enrollments/:id
 */
exports.dropCourse = async (req, res) => {
  try {
    const { id: enrollmentId } = req.params;
    const userId = req.user.id;

    const enrollment = await CourseEnrollment.findOne({
      where: { id: enrollmentId, userId }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Don't allow dropping completed courses
    if (enrollment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot drop a completed course'
      });
    }

    // Update status to dropped instead of deleting
    await enrollment.update({ status: 'dropped' });

    res.json({
      success: true,
      message: 'Successfully dropped from course'
    });
  } catch (error) {
    console.error('Drop course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to drop course',
      error: error.message
    });
  }
};
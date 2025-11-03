const {
  User,
  Organization,
  OnboardingTask,
  Onboarding,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// Get all onboarding tasks for current user
const getUserOnboardingTasks = async (req, res) => {
  try {
    const user = req.user;

    // Get all active onboarding tasks for the organization that match user's role
    const activeTasks = await OnboardingTask.findAll({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        assignToRoles: {
          [Op.contains]: [user.role]
        }
      },
      order: [['order', 'ASC'], ['createdAt', 'ASC']]
    });

    // Get user's onboarding progress
    const userProgress = await Onboarding.findAll({
      where: {
        userId: user.id
      }
    });

    // Create a map for quick lookup
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.taskId] = progress;
    });

    // For tasks without progress records, create them
    const tasksToCreate = [];
    activeTasks.forEach(task => {
      if (!progressMap[task.id]) {
        // Calculate due date if dueInDays is set
        let dueDate = null;
        if (task.dueInDays) {
          dueDate = new Date(user.createdAt);
          dueDate.setDate(dueDate.getDate() + task.dueInDays);
        }

        tasksToCreate.push({
          userId: user.id,
          organizationId: user.organizationId,
          taskId: task.id,
          completed: false,
          dueDate
        });
      }
    });

    // Bulk create missing onboarding records
    if (tasksToCreate.length > 0) {
      await Onboarding.bulkCreate(tasksToCreate);

      // Re-fetch user progress
      const updatedProgress = await Onboarding.findAll({
        where: {
          userId: user.id
        }
      });

      updatedProgress.forEach(progress => {
        progressMap[progress.taskId] = progress;
      });
    }

    // Combine task details with progress
    const tasksWithProgress = activeTasks.map(task => {
      const progress = progressMap[task.id];
      return {
        _id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        order: task.order,
        mandatory: task.mandatory,
        instructions: task.instructions,
        resourceLinks: task.resourceLinks,
        completed: progress ? progress.completed : false,
        completedAt: progress ? progress.completedAt : null,
        dueDate: progress ? progress.dueDate : null,
        notes: progress ? progress.notes : null,
        skipped: progress ? progress.skipped : false,
        progressId: progress ? progress.id : null
      };
    });

    // Calculate progress stats
    const total = tasksWithProgress.length;
    const completed = tasksWithProgress.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      data: tasksWithProgress,
      stats: {
        total,
        completed,
        pending: total - completed,
        percentage
      }
    });

  } catch (error) {
    console.error('Get user onboarding tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding tasks',
      error: error.message
    });
  }
};

// Update task completion status
const updateTaskStatus = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const { completed, notes } = req.body;

    // Find or create onboarding record
    let onboarding = await Onboarding.findOne({
      where: {
        userId: user.id,
        taskId
      }
    });

    if (!onboarding) {
      // Get task details to set due date
      const task = await OnboardingTask.findByPk(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Onboarding task not found'
        });
      }

      let dueDate = null;
      if (task.dueInDays) {
        dueDate = new Date(user.createdAt);
        dueDate.setDate(dueDate.getDate() + task.dueInDays);
      }

      onboarding = await Onboarding.create({
        userId: user.id,
        organizationId: user.organizationId,
        taskId,
        completed: false,
        dueDate
      });
    }

    // Update completion status
    onboarding.completed = completed;
    if (completed && !onboarding.completedAt) {
      onboarding.completedAt = new Date();
    } else if (!completed) {
      onboarding.completedAt = null;
    }

    if (notes !== undefined) {
      onboarding.notes = notes;
    }

    if (!onboarding.startedAt && completed) {
      onboarding.startedAt = new Date();
    }

    await onboarding.save();

    // Get updated progress
    const progress = await Onboarding.getProgress(user.id);

    res.json({
      success: true,
      message: `Task marked as ${completed ? 'completed' : 'incomplete'}`,
      data: {
        onboarding,
        progress
      }
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
};

// Get onboarding progress summary
const getOnboardingProgress = async (req, res) => {
  try {
    const user = req.user;
    const progress = await Onboarding.getProgress(user.id);

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Get onboarding progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding progress',
      error: error.message
    });
  }
};

// Admin: Create onboarding task
const createOnboardingTask = async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      category,
      priority,
      order,
      mandatory,
      dueInDays,
      assignToRoles,
      instructions,
      resourceLinks
    } = req.body;

    const task = await OnboardingTask.create({
      organizationId: user.organizationId,
      title,
      description,
      category,
      priority: priority || 'medium',
      order: order || 0,
      mandatory: mandatory || false,
      dueInDays,
      assignToRoles: assignToRoles || ['employee'],
      instructions,
      resourceLinks: resourceLinks || [],
      isActive: true,
      createdBy: user.id
    });

    res.status(201).json({
      success: true,
      message: 'Onboarding task created successfully',
      data: task
    });

  } catch (error) {
    console.error('Create onboarding task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create onboarding task',
      error: error.message
    });
  }
};

// Admin: Get all onboarding tasks
const getAllOnboardingTasks = async (req, res) => {
  try {
    const user = req.user;

    const tasks = await OnboardingTask.findAll({
      where: {
        organizationId: user.organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Get all onboarding tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding tasks',
      error: error.message
    });
  }
};

// Admin: Update onboarding task
const updateOnboardingTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const updateData = req.body;

    const task = await OnboardingTask.findOne({
      where: {
        id: taskId,
        organizationId: user.organizationId
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding task not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'category', 'priority', 'order',
      'mandatory', 'dueInDays', 'assignToRoles', 'instructions',
      'resourceLinks', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    task.updatedBy = user.id;
    await task.save();

    res.json({
      success: true,
      message: 'Onboarding task updated successfully',
      data: task
    });

  } catch (error) {
    console.error('Update onboarding task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding task',
      error: error.message
    });
  }
};

// Admin: Delete onboarding task
const deleteOnboardingTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;

    const task = await OnboardingTask.findOne({
      where: {
        id: taskId,
        organizationId: user.organizationId
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Onboarding task deleted successfully'
    });

  } catch (error) {
    console.error('Delete onboarding task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete onboarding task',
      error: error.message
    });
  }
};

// Admin: Get organization onboarding statistics
const getOrganizationOnboardingStats = async (req, res) => {
  try {
    const user = req.user;

    // Get all users in organization
    const users = await User.findAll({
      where: {
        organizationId: user.organizationId,
        role: { [Op.ne]: 'temp_setup' }
      },
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    // Get all onboarding records
    const onboardingRecords = await Onboarding.findAll({
      where: {
        organizationId: user.organizationId
      },
      include: [
        {
          model: OnboardingTask,
          as: 'task',
          attributes: ['title', 'category', 'mandatory']
        }
      ]
    });

    // Calculate per-user progress
    const userStats = [];
    for (const u of users) {
      const userRecords = onboardingRecords.filter(r => r.userId === u.id);
      const total = userRecords.length;
      const completed = userRecords.filter(r => r.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      userStats.push({
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        role: u.role,
        joinedAt: u.createdAt,
        total,
        completed,
        pending: total - completed,
        percentage
      });
    }

    // Overall stats
    const totalTasks = await OnboardingTask.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    const completedTasks = onboardingRecords.filter(r => r.completed).length;
    const pendingTasks = onboardingRecords.filter(r => !r.completed).length;

    res.json({
      success: true,
      data: {
        overall: {
          totalTasks,
          totalAssignments: onboardingRecords.length,
          completedAssignments: completedTasks,
          pendingAssignments: pendingTasks,
          totalUsers: users.length
        },
        userStats: userStats.sort((a, b) => a.percentage - b.percentage)
      }
    });

  } catch (error) {
    console.error('Get organization onboarding stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding statistics',
      error: error.message
    });
  }
};

module.exports = {
  getUserOnboardingTasks,
  updateTaskStatus,
  getOnboardingProgress,
  createOnboardingTask,
  getAllOnboardingTasks,
  updateOnboardingTask,
  deleteOnboardingTask,
  getOrganizationOnboardingStats
};

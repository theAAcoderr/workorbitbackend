const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const oneSignalService = require('../services/oneSignalService');

const taskController = {
  // Get all tasks for a project
  async getTasks(req, res) {
    try {
      const { projectId } = req.params;
      const { status, priority, assigneeId, type } = req.query;
      const { organizationId } = req.user;

      // Verify project belongs to organization
      const project = await Project.findOne({
        where: { id: projectId, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const whereClause = { projectId };
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (assigneeId) whereClause.assigneeId = assigneeId;
      if (type) whereClause.type = type;

      const tasks = await Task.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['dueDate', 'ASC']]
      });

      res.json({ success: true, tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
    }
  },

  // Get single task by ID
  async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Get subtasks if any
      if (task.subtaskIds && task.subtaskIds.length > 0) {
        const subtasks = await Task.findAll({
          where: { id: task.subtaskIds }
        });
        task.dataValues.subtasks = subtasks;
      }

      res.json({ success: true, task });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch task', error: error.message });
    }
  },

  // Create new task
  async createTask(req, res) {
    try {
      const { projectId } = req.params;
      const { organizationId, id: userId } = req.user;

      // Verify project belongs to organization
      const project = await Project.findOne({
        where: { id: projectId, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const taskData = {
        ...req.body,
        projectId,
        createdBy: userId,
        assigneeId: req.body.assigneeId || userId, // Use current user as assignee if not provided
        reporterId: req.body.reporterId || userId, // Use current user as reporter if not provided
        id: undefined // Let database generate UUID
      };

      // Clean up empty string UUIDs
      if (taskData.assigneeId === '') {
        taskData.assigneeId = userId;
      }
      if (taskData.reporterId === '') {
        taskData.reporterId = userId;
      }

      const task = await Task.create(taskData);

      // Update parent task if this is a subtask
      if (task.parentTaskId) {
        const parentTask = await Task.findByPk(task.parentTaskId);
        if (parentTask) {
          const subtaskIds = [...(parentTask.subtaskIds || []), task.id];
          await parentTask.update({ subtaskIds });
        }
      }

      // Send notification to assignee if task is assigned to someone else
      try {
        if (task.assigneeId && task.assigneeId !== userId) {
          const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';

          await oneSignalService.sendToUser(
            task.assigneeId.toString(),
            {
              title: '📋 New Task Assigned',
              message: `"${task.title}" assigned by ${req.user.name}`,
              data: {
                type: 'task_assigned',
                taskId: task.id,
                taskTitle: task.title,
                priority: task.priority,
                dueDate: task.dueDate,
                assignedBy: req.user.name,
                projectId: task.projectId,
                timestamp: new Date().toISOString()
              }
            }
          );
          console.log(`✅ Task assignment notification sent to user: ${task.assigneeId}`);
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send task assignment notification:', notificationError);
        // Don't fail the task creation if notification fails
      }

      res.status(201).json({ success: true, task, message: 'Task created successfully' });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
    }
  },

  // Update task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const updateData = {
        ...req.body,
        updatedBy: userId,
        id: undefined, // Prevent ID update
        projectId: undefined, // Prevent project change
        createdBy: undefined // Prevent creator change
      };

      // Handle status change to completed
      const wasCompleted = updateData.status === 'done' && task.status !== 'done';
      if (wasCompleted) {
        updateData.completedDate = new Date();
        updateData.progress = 100;
      }

      await task.update(updateData);

      // Update project completion percentage if needed
      await taskController.updateProjectProgress(task.projectId);

      // Send notification when task is completed
      if (wasCompleted) {
        try {
          // Notify reporter/creator
          if (task.reporterId && task.reporterId !== userId) {
            await oneSignalService.sendToUser(
              task.reporterId.toString(),
              {
                title: '✅ Task Completed',
                message: `"${task.title}" completed by ${req.user.name}`,
                data: {
                  type: 'task_completed',
                  taskId: task.id,
                  taskTitle: task.title,
                  completedBy: req.user.name,
                  projectId: task.projectId,
                  timestamp: new Date().toISOString()
                }
              }
            );
          }

          // Also notify project manager if different from reporter
          if (project.managerId && project.managerId !== task.reporterId && project.managerId !== userId) {
            await oneSignalService.sendToUser(
              project.managerId.toString(),
              {
                title: '✅ Task Completed',
                message: `"${task.title}" completed in ${project.name}`,
                data: {
                  type: 'task_completed',
                  taskId: task.id,
                  taskTitle: task.title,
                  completedBy: req.user.name,
                  projectId: task.projectId,
                  projectName: project.name,
                  timestamp: new Date().toISOString()
                }
              }
            );
          }

          console.log('✅ Task completion notifications sent');
        } catch (notificationError) {
          console.error('⚠️ Failed to send task completion notification:', notificationError);
          // Don't fail the update if notification fails
        }
      }

      res.json({ success: true, task, message: 'Task updated successfully' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
    }
  },

  // Delete task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Remove from parent's subtasks if applicable
      if (task.parentTaskId) {
        const parentTask = await Task.findByPk(task.parentTaskId);
        if (parentTask) {
          const subtaskIds = (parentTask.subtaskIds || []).filter(sid => sid !== id);
          await parentTask.update({ subtaskIds });
        }
      }

      await task.destroy();

      // Update project completion percentage
      await taskController.updateProjectProgress(task.projectId);

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
    }
  },

  // Add comment to task
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { comment, mentionedUserIds, attachmentUrl } = req.body;
      const { organizationId, id: userId, name: userName } = req.user;

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const newComment = {
        id: require('crypto').randomUUID(),
        userId,
        userName,
        comment,
        timestamp: Date.now(),
        mentionedUserIds: mentionedUserIds || [],
        attachmentUrl
      };

      const comments = [...(task.comments || []), newComment];
      await task.update({ comments, updatedBy: userId });

      res.json({ success: true, comment: newComment, message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
    }
  },

  // Update task progress
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const { organizationId, id: userId } = req.user;

      if (progress < 0 || progress > 100) {
        return res.status(400).json({ success: false, message: 'Progress must be between 0 and 100' });
      }

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const updateData = { progress, updatedBy: userId };

      // Auto-update status based on progress
      if (progress === 100 && task.status !== 'done') {
        updateData.status = 'done';
        updateData.completedDate = new Date();
      } else if (progress > 0 && progress < 100 && task.status === 'todo') {
        updateData.status = 'inProgress';
      }

      await task.update(updateData);

      // Update project completion percentage
      await taskController.updateProjectProgress(task.projectId);

      res.json({ success: true, task, message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ success: false, message: 'Failed to update progress', error: error.message });
    }
  },

  // Update checklist item
  async updateChecklistItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const { isCompleted } = req.body;
      const { organizationId, id: userId } = req.user;

      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      // Verify task belongs to organization's project
      const project = await Project.findOne({
        where: { id: task.projectId, organizationId }
      });

      if (!project) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const checklist = task.checklist || [];
      const itemIndex = checklist.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Checklist item not found' });
      }

      checklist[itemIndex].isCompleted = isCompleted;
      if (isCompleted) {
        checklist[itemIndex].completedBy = userId;
        checklist[itemIndex].completedAt = Date.now();
      } else {
        checklist[itemIndex].completedBy = null;
        checklist[itemIndex].completedAt = null;
      }

      await task.update({ checklist, updatedBy: userId });

      res.json({ success: true, checklist: checklist[itemIndex], message: 'Checklist item updated' });
    } catch (error) {
      console.error('Error updating checklist:', error);
      res.status(500).json({ success: false, message: 'Failed to update checklist item', error: error.message });
    }
  },

  // Helper function to update project progress
  async updateProjectProgress(projectId) {
    try {
      const tasks = await Task.findAll({
        where: { projectId },
        attributes: ['progress']
      });

      if (tasks.length > 0) {
        const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
        const averageProgress = Math.round(totalProgress / tasks.length);

        await Project.update(
          { completionPercentage: averageProgress },
          { where: { id: projectId } }
        );
      }
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  },

  // Get tasks by assignee
  async getTasksByAssignee(req, res) {
    try {
      const { assigneeId } = req.params;
      const { organizationId } = req.user;

      // Get all projects for the organization
      const projects = await Project.findAll({
        where: { organizationId },
        attributes: ['id']
      });

      const projectIds = projects.map(p => p.id);

      const tasks = await Task.findAll({
        where: {
          projectId: projectIds,
          [Op.or]: [
            { assigneeId },
            { assigneeIds: { [Op.contains]: [assigneeId] } }
          ]
        },
        order: [['priority', 'DESC'], ['dueDate', 'ASC']]
      });

      res.json({ success: true, tasks });
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
    }
  },

  // Get tasks assigned to current user (My Tasks)
  async getMyTasks(req, res) {
    try {
      const { id: userId, organizationId } = req.user;
      const { status, priority, projectId } = req.query;

      // Get all projects for the organization
      const projects = await Project.findAll({
        where: { organizationId },
        attributes: ['id']
      });

      const projectIds = projects.map(p => p.id);

      const whereClause = {
        projectId: projectIds,
        [Op.or]: [
          { assigneeId: userId },
          { assigneeIds: { [Op.contains]: [userId] } }
        ]
      };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (projectId) whereClause.projectId = projectId;

      const tasks = await Task.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['dueDate', 'ASC']],
        include: [{
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        }]
      });

      res.json({ success: true, data: { tasks } });
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch my tasks', error: error.message });
    }
  },

  // Get all tasks across all projects (Admin/Manager view)
  async getAllTasks(req, res) {
    try {
      const { organizationId, role } = req.user;
      const { status, priority, projectId, assigneeId } = req.query;

      // Only admin, manager, and HR can view all tasks
      if (!['admin', 'manager', 'hr'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Get all projects for the organization
      const projects = await Project.findAll({
        where: { organizationId },
        attributes: ['id']
      });

      const projectIds = projects.map(p => p.id);

      const whereClause = {
        projectId: projectIds
      };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (projectId) whereClause.projectId = projectId;
      if (assigneeId) whereClause.assigneeId = assigneeId;

      const tasks = await Task.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['dueDate', 'ASC']],
        include: [{
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        }]
      });

      res.json({ success: true, data: { tasks } });
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch all tasks', error: error.message });
    }
  },

  // Bulk update tasks
  async bulkUpdateTasks(req, res) {
    try {
      const { taskIds, updates } = req.body;
      const { organizationId, id: userId } = req.user;

      // Verify all tasks belong to organization's projects
      const tasks = await Task.findAll({
        where: { id: taskIds },
        include: [{
          model: Project,
          as: 'project',
          where: { organizationId },
          attributes: ['id']
        }]
      });

      if (tasks.length !== taskIds.length) {
        return res.status(403).json({ success: false, message: 'Some tasks not found or access denied' });
      }

      const updateData = {
        ...updates,
        updatedBy: userId,
        id: undefined,
        projectId: undefined,
        createdBy: undefined
      };

      await Task.update(updateData, {
        where: { id: taskIds }
      });

      res.json({ success: true, message: `${taskIds.length} tasks updated successfully` });
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to update tasks', error: error.message });
    }
  }
};

module.exports = taskController;
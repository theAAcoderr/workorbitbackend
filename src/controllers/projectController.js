const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

const projectController = {
  // Get all projects for an organization
  async getProjects(req, res) {
    try {
      const { organizationId, id: userId, role } = req.user;
      const { status, priority, projectManagerId, assignedOnly } = req.query;

      const whereClause = { organizationId };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (projectManagerId) whereClause.projectManagerId = projectManagerId;

      // Filter to show only assigned projects for all non-admin users
      // Only admin can see all projects
      // All other users (including HR) see only projects they're assigned to or created
      if (role !== 'admin') {
        whereClause[Op.or] = [
          { createdBy: userId },  // Projects created by this user
          { projectManagerId: userId },  // Projects managed by this user
          { teamMemberIds: { [Op.contains]: [userId] } }  // Projects where user is a team member
        ];
      }

      const projects = await Project.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, projects });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
    }
  },

  // Get single project by ID
  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check if user has access to this project (unless admin)
      if (role !== 'admin') {
        const hasAccess =
          project.createdBy === userId ||
          project.projectManagerId === userId ||
          (project.teamMemberIds && project.teamMemberIds.includes(userId));

        if (!hasAccess) {
          return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this project.' });
        }
      }

      // Get tasks count by status
      const taskStats = await Task.findAll({
        where: { projectId: project.id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
        group: ['status']
      });

      project.dataValues.taskStats = taskStats;

      res.json({ success: true, project });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
    }
  },

  // Create new project
  async createProject(req, res) {
    try {
      const { organizationId, id: userId } = req.user;

      // Ensure projectManagerId is set properly
      const projectData = {
        ...req.body,
        organizationId,
        createdBy: userId,
        projectManagerId: req.body.projectManagerId || userId, // Use current user as manager if not provided
        id: undefined // Let database generate UUID
      };

      // Clean up empty string UUIDs
      if (projectData.projectManagerId === '') {
        projectData.projectManagerId = userId;
      }

      const project = await Project.create(projectData);

      // 🔔 ADMIN NOTIFICATION: New project created
      await adminNotificationService.notifyProjectCreated(
        organizationId,
        {
          projectId: project.id,
          projectName: project.name,
          owner: req.user.name,
          budget: project.budget || 0,
          deadline: project.endDate
        }
      ).catch(err => console.error('Admin notification error:', err));

      res.status(201).json({ success: true, project, message: 'Project created successfully' });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
    }
  },

  // Update project
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check if user has permission to update this project
      if (role !== 'admin') {
        const canUpdate =
          project.createdBy === userId ||
          project.projectManagerId === userId;

        if (!canUpdate) {
          return res.status(403).json({ success: false, message: 'Access denied. Only project creator or manager can update this project.' });
        }
      }

      const updateData = {
        ...req.body,
        updatedBy: userId,
        id: undefined, // Prevent ID update
        organizationId: undefined, // Prevent org change
        createdBy: undefined // Prevent creator change
      };

      // Store old status before update
      const oldStatus = project.status;

      await project.update(updateData);

      // 🔔 ADMIN NOTIFICATION: Project status changed
      if (req.body.status && req.body.status !== oldStatus) {
        await adminNotificationService.notifyProjectStatusChanged(
          organizationId,
          {
            projectId: project.id,
            projectName: project.name,
            oldStatus: oldStatus,
            newStatus: req.body.status
          }
        ).catch(err => console.error('Admin notification error:', err));
      }

      // Send notification to team members if status changed
      try {
        if (req.body.status && req.body.status !== oldStatus) {
          const teamMembers = project.teamMemberIds || [];
          const allRecipients = [
            ...teamMembers,
            project.projectManagerId,
            project.createdBy
          ].filter((id, index, arr) => arr.indexOf(id) === index && id !== userId); // Remove duplicates and current user

          for (const recipientId of allRecipients) {
            await oneSignalService.sendToUser(
              recipientId.toString(),
              {
                title: '📋 Project Status Updated',
                message: `Project "${project.name}" status changed to ${req.body.status}`,
                data: {
                  type: 'project_status_updated',
                  projectId: project.id,
                  projectName: project.name,
                  oldStatus: oldStatus,
                  newStatus: req.body.status,
                  updatedBy: req.user.name,
                  timestamp: new Date().toISOString()
                }
              }
            );
          }
          console.log(`✅ Project status update notifications sent to ${allRecipients.length} team members`);
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send project status update notification:', notificationError);
        // Don't fail the update if notification fails
      }

      res.json({ success: true, project, message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
    }
  },

  // Delete project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId, role } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check if user has permission to delete this project
      if (role !== 'admin') {
        const canDelete = project.createdBy === userId;

        if (!canDelete) {
          return res.status(403).json({ success: false, message: 'Access denied. Only project creator or admin can delete this project.' });
        }
      }

      // Tasks will be deleted automatically due to CASCADE
      await project.destroy();

      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
    }
  },

  // Add team members to project
  async addTeamMembers(req, res) {
    try {
      const { id } = req.params;
      const { memberIds } = req.body;
      const { organizationId } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const currentMembers = project.teamMemberIds || [];
      const updatedMembers = [...new Set([...currentMembers, ...memberIds])];

      await project.update({ teamMemberIds: updatedMembers });

      // Send notification to newly added team members
      try {
        const newMembers = memberIds.filter(id => !currentMembers.includes(id));

        for (const memberId of newMembers) {
          await oneSignalService.sendToUser(
            memberId.toString(),
            {
              title: '🎯 Added to Project',
              message: `You have been added to the project "${project.name}"`,
              data: {
                type: 'project_team_added',
                projectId: project.id,
                projectName: project.name,
                priority: project.priority,
                startDate: project.startDate,
                endDate: project.endDate,
                timestamp: new Date().toISOString()
              }
            }
          );
        }
        console.log(`✅ Project team assignment notifications sent to ${newMembers.length} members`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send project team assignment notification:', notificationError);
        // Don't fail the operation if notification fails
      }

      res.json({ success: true, project, message: 'Team members added successfully' });
    } catch (error) {
      console.error('Error adding team members:', error);
      res.status(500).json({ success: false, message: 'Failed to add team members', error: error.message });
    }
  },

  // Remove team members from project
  async removeTeamMembers(req, res) {
    try {
      const { id } = req.params;
      const { memberIds } = req.body;
      const { organizationId } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const currentMembers = project.teamMemberIds || [];
      const updatedMembers = currentMembers.filter(memberId => !memberIds.includes(memberId));

      await project.update({ teamMemberIds: updatedMembers });

      res.json({ success: true, project, message: 'Team members removed successfully' });
    } catch (error) {
      console.error('Error removing team members:', error);
      res.status(500).json({ success: false, message: 'Failed to remove team members', error: error.message });
    }
  },

  // Update project budget
  async updateBudget(req, res) {
    try {
      const { id } = req.params;
      const { budget, spentBudget } = req.body;
      const { organizationId, id: userId } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const updateData = { updatedBy: userId };
      if (budget !== undefined) updateData.budget = budget;
      if (spentBudget !== undefined) updateData.spentBudget = spentBudget;

      await project.update(updateData);

      res.json({ success: true, project, message: 'Budget updated successfully' });
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ success: false, message: 'Failed to update budget', error: error.message });
    }
  },

  // Get project statistics
  async getProjectStats(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const project = await Project.findOne({
        where: { id, organizationId }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Get task statistics
      const totalTasks = await Task.count({ where: { projectId: id } });
      const completedTasks = await Task.count({ where: { projectId: id, status: 'done' } });
      const inProgressTasks = await Task.count({ where: { projectId: id, status: 'inProgress' } });
      const blockedTasks = await Task.count({ where: { projectId: id, status: 'blocked' } });

      // Calculate progress
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const stats = {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          blocked: blockedTasks,
          progress: taskProgress
        },
        budget: {
          total: project.budget,
          spent: project.spentBudget,
          utilization: project.budget > 0 ? ((project.spentBudget / project.budget) * 100).toFixed(2) : 0
        },
        timeline: {
          startDate: project.startDate,
          endDate: project.endDate,
          daysRemaining: Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
          isOverdue: new Date() > new Date(project.endDate) && project.status !== 'completed'
        }
      };

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching project stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch project statistics', error: error.message });
    }
  },

  // Get projects assigned to current user
  async getUserAssignedProjects(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const { status, priority } = req.query;

      const whereClause = {
        organizationId,
        [Op.or]: [
          { createdBy: userId },  // Projects created by this user
          { projectManagerId: userId },  // Projects managed by this user
          { teamMemberIds: { [Op.contains]: [userId] } }  // Projects where user is a team member
        ]
      };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;

      const projects = await Project.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, projects });
    } catch (error) {
      console.error('Error fetching user assigned projects:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch assigned projects', error: error.message });
    }
  }
};

module.exports = projectController;
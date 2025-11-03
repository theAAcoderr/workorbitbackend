const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Project routes
router.get('/projects', projectController.getProjects);
router.get('/projects/assigned', projectController.getUserAssignedProjects);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);
router.post('/projects/:id/team/add', projectController.addTeamMembers);
router.post('/projects/:id/team/remove', projectController.removeTeamMembers);
router.put('/projects/:id/budget', projectController.updateBudget);
router.get('/projects/:id/stats', projectController.getProjectStats);

// Task routes
router.get('/projects/:projectId/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/projects/:projectId/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.post('/tasks/:id/comments', taskController.addComment);
router.put('/tasks/:id/progress', taskController.updateProgress);
router.put('/tasks/:id/checklist/:itemId', taskController.updateChecklistItem);
router.get('/tasks/assignee/:assigneeId', taskController.getTasksByAssignee);
router.put('/tasks/bulk-update', taskController.bulkUpdateTasks);

module.exports = router;
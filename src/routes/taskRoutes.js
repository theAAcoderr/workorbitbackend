const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Protect all routes
router.use(authMiddleware);

// My tasks endpoint - must be before /:id to avoid route conflict
router.get('/my-tasks', taskController.getMyTasks);
router.get('/user/me', taskController.getMyTasks); // Alias for my-tasks

// All tasks endpoint - admin/manager only
router.get('/all', authorizeRoles('admin', 'manager', 'hr'), taskController.getAllTasks);

// Project-specific task routes
router.get('/project/:projectId', taskController.getTasks);
router.post('/project/:projectId', authorizeRoles('admin', 'manager', 'hr'), taskController.createTask);

// Assignee-specific routes
router.get('/assignee/:assigneeId', taskController.getTasksByAssignee);

// Bulk operations
router.post('/bulk-update', authorizeRoles('admin', 'manager', 'hr'), taskController.bulkUpdateTasks);

// Individual task routes
router.get('/:id', taskController.getTaskById);
router.put('/:id', authorizeRoles('admin', 'manager', 'hr', 'employee'), taskController.updateTask);
router.delete('/:id', authorizeRoles('admin', 'manager', 'hr'), taskController.deleteTask);

// Task interactions
router.post('/:id/comments', taskController.addComment);
router.put('/:id/progress', taskController.updateProgress);
router.put('/:id/checklist/:itemId', taskController.updateChecklistItem);

module.exports = router;

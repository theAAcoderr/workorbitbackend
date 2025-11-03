const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');
const {
  getUserOnboardingTasks,
  updateTaskStatus,
  getOnboardingProgress,
  createOnboardingTask,
  getAllOnboardingTasks,
  updateOnboardingTask,
  deleteOnboardingTask,
  getOrganizationOnboardingStats
} = require('../controllers/onboardingController');

// Employee routes - Access onboarding tasks and update progress
router.get('/', authMiddleware, cacheMiddleware(60), getUserOnboardingTasks);
router.get('/progress', authMiddleware, cacheMiddleware(60), getOnboardingProgress);
router.put('/:taskId', authMiddleware, updateTaskStatus);

// Admin/HR routes - Manage onboarding tasks
router.post('/tasks', authMiddleware, authorizeRoles(['admin', 'hr']), createOnboardingTask);
router.get('/tasks/all', authMiddleware, authorizeRoles(['admin', 'hr']), cacheMiddleware(120), getAllOnboardingTasks);
router.put('/tasks/:taskId', authMiddleware, authorizeRoles(['admin', 'hr']), updateOnboardingTask);
router.delete('/tasks/:taskId', authMiddleware, authorizeRoles(['admin', 'hr']), deleteOnboardingTask);
router.get('/stats', authMiddleware, authorizeRoles(['admin', 'hr']), cacheMiddleware(180), getOrganizationOnboardingStats);

module.exports = router;

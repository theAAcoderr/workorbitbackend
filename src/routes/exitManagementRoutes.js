const express = require('express');
const router = express.Router();
const {
  getExitProcesses,
  getExitProcess,
  initiateExit,
  updateExitProcess,
  updateChecklistItem,
  completeExitProcess,
  cancelExitProcess,
  getExitStatistics
} = require('../controllers/exitManagementController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Routes accessible to all authenticated users (employees can view their own exit)
router.get('/', getExitProcesses);  // Controller handles role-based filtering
router.get('/:id', getExitProcess);  // Controller handles ownership check

// Admin/HR only routes
router.get('/stats', authorizeRoles('admin', 'hr'), getExitStatistics);
router.post('/', authorizeRoles('admin', 'hr'), initiateExit);
router.put('/:id', authorizeRoles('admin', 'hr'), updateExitProcess);
router.put('/:id/checklist', authorizeRoles('admin', 'hr'), updateChecklistItem);
router.post('/:id/complete', authorizeRoles('admin', 'hr'), completeExitProcess);
router.delete('/:id', authorizeRoles('admin', 'hr'), cancelExitProcess);

module.exports = router;

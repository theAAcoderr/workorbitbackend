const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const leavePolicyController = require('../controllers/leavePolicyController');

// Protect all routes
router.use(authMiddleware);

// Get all policies and create new policy
router.get('/', leavePolicyController.getLeavePolicies);
router.post('/', authorizeRoles('admin', 'hr'), leavePolicyController.createLeavePolicy);

// Individual policy routes
router.get('/:id', leavePolicyController.getLeavePolicy);
router.put('/:id', authorizeRoles('admin', 'hr'), leavePolicyController.updateLeavePolicy);
router.delete('/:id', authorizeRoles('admin'), leavePolicyController.deleteLeavePolicy);

module.exports = router;

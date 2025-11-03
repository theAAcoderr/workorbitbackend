const express = require('express');
const router = express.Router();
const {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
  getPolicyAcknowledgments
} = require('../controllers/policyController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Public routes (all authenticated users)
router.get('/', getPolicies);
router.get('/:id', getPolicy);
router.post('/:id/acknowledge', acknowledgePolicy);

// Protected routes (Admin, HR)
router.post('/', authorizeRoles('admin', 'hr'), createPolicy);
router.put('/:id', authorizeRoles('admin', 'hr'), updatePolicy);
router.delete('/:id', authorizeRoles('admin', 'hr'), deletePolicy);
router.get('/:id/acknowledgments', authorizeRoles('admin', 'hr'), getPolicyAcknowledgments);

module.exports = router;

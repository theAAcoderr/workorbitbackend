const express = require('express');
const router = express.Router();
const hierarchyController = require('../controllers/hierarchyController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All hierarchy routes require authentication
router.use(authMiddleware);

// Get pending join requests (admin and HR only)
router.get('/requests/pending', 
  authorizeRoles('admin', 'hr'), 
  hierarchyController.getPendingRequests
);

// Approve/reject join requests (admin and HR only)
router.put('/requests/:requestId/approve', 
  authorizeRoles('admin', 'hr'), 
  hierarchyController.approveRequest
);

router.put('/requests/:requestId/reject', 
  authorizeRoles('admin', 'hr'), 
  hierarchyController.rejectRequest
);

// Get organization hierarchy
router.get('/organization', hierarchyController.getOrganizationHierarchy);

// Validate codes (public within authenticated context)
router.get('/validate/org-code/:code', hierarchyController.validateOrgCode);
router.get('/validate/hr-code/:code', hierarchyController.validateHRCode);

module.exports = router;
const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all compliance items for organization
router.get('/', complianceController.getCompliances);

// Get expiring compliance items
router.get('/expiring', complianceController.getExpiringCompliances);

// Get expired compliance items
router.get('/expired', complianceController.getExpiredCompliances);

// Get single compliance item
router.get('/:id', complianceController.getCompliance);

// Create compliance item (admin, hr, manager only)
router.post(
  '/',
  authorizeRoles('admin', 'hr', 'manager'),
  complianceController.createCompliance
);

// Update compliance item (admin, hr, manager only)
router.put(
  '/:id',
  authorizeRoles('admin', 'hr', 'manager'),
  complianceController.updateCompliance
);

// Renew compliance item (admin, hr, manager only)
router.post(
  '/:id/renew',
  authorizeRoles('admin', 'hr', 'manager'),
  complianceController.renewCompliance
);

// Delete compliance item (admin, hr only)
router.delete(
  '/:id',
  authorizeRoles('admin', 'hr'),
  complianceController.deleteCompliance
);

module.exports = router;

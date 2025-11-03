const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const assetRequestController = require('../controllers/assetRequestController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  validateCreateAsset,
  validateUpdateAsset,
  validateAssignAsset,
  validateMaintenanceRecord,
  validateCreateAssetRequest,
  validateApproveRequest,
  validateRejectRequest,
  validateAssetId,
  validateRequestId,
  validateAssetQuery,
  validateRequestQuery
} = require('../middleware/validators/assetValidators');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// ASSET ROUTES
// ============================================

// Statistics (Admin, HR, Manager)
router.get(
  '/stats',
  authorizeRoles('admin', 'hr', 'manager'),
  assetController.getAssetStats
);

// My assets (All authenticated users)
router.get('/my-assets', assetController.getMyAssets);

// ============================================
// ASSET REQUEST ROUTES (Must come BEFORE /:id routes)
// ============================================

// Get pending requests count (Admin, HR)
router.get(
  '/requests/pending-count',
  authorizeRoles('admin', 'hr'),
  assetRequestController.getPendingRequestsCount
);

// Get my asset requests (All authenticated users)
router.get('/requests/my-requests', assetRequestController.getMyAssetRequests);

// Get all asset requests
router.get('/requests', validateRequestQuery, handleValidationErrors, assetRequestController.getAssetRequests);

// Create asset request (All authenticated users)
router.post('/requests', validateCreateAssetRequest, handleValidationErrors, assetRequestController.createAssetRequest);

// Get single asset request
router.get('/requests/:id', validateRequestId, handleValidationErrors, assetRequestController.getAssetRequestById);

// Approve asset request (Admin, HR only)
router.post(
  '/requests/:id/approve',
  authorizeRoles('admin', 'hr'),
  validateApproveRequest,
  handleValidationErrors,
  assetRequestController.approveAssetRequest
);

// Reject asset request (Admin, HR only)
router.post(
  '/requests/:id/reject',
  authorizeRoles('admin', 'hr'),
  validateRejectRequest,
  handleValidationErrors,
  assetRequestController.rejectAssetRequest
);

// Cancel asset request (Request owner)
router.post('/requests/:id/cancel', validateRequestId, handleValidationErrors, assetRequestController.cancelAssetRequest);

// ============================================
// ASSET ROUTES (/:id routes come AFTER specific routes)
// ============================================

// Get all assets
router.get('/', validateAssetQuery, handleValidationErrors, assetController.getAssets);

// Create new asset (Admin, HR only)
router.post(
  '/',
  authorizeRoles('admin', 'hr'),
  validateCreateAsset,
  handleValidationErrors,
  assetController.createAsset
);

// Get single asset
router.get('/:id', validateAssetId, handleValidationErrors, assetController.getAssetById);

// Update asset (Admin, HR only)
router.put(
  '/:id',
  authorizeRoles('admin', 'hr'),
  validateUpdateAsset,
  handleValidationErrors,
  assetController.updateAsset
);

// Delete asset (Admin only)
router.delete(
  '/:id',
  authorizeRoles('admin'),
  validateAssetId,
  handleValidationErrors,
  assetController.deleteAsset
);

// Assign asset to employee (Admin, HR only)
router.post(
  '/:id/assign',
  authorizeRoles('admin', 'hr'),
  validateAssignAsset,
  handleValidationErrors,
  assetController.assignAsset
);

// Unassign/Return asset (Admin, HR only)
router.post(
  '/:id/unassign',
  authorizeRoles('admin', 'hr'),
  validateAssetId,
  handleValidationErrors,
  assetController.unassignAsset
);

// Add maintenance record (Admin, HR only)
router.post(
  '/:id/maintenance',
  authorizeRoles('admin', 'hr'),
  validateMaintenanceRecord,
  handleValidationErrors,
  assetController.addMaintenanceRecord
);

module.exports = router;

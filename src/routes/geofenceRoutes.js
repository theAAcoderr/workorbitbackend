const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const geofenceController = require('../controllers/geofenceController');

// All routes require authentication
router.use(authMiddleware);

// Geofence CRUD operations
router.get('/', geofenceController.getGeofences);
router.get('/:id', geofenceController.getGeofenceById);
router.post('/', authorizeRoles('admin', 'hr', 'manager'), geofenceController.createGeofence);
router.put('/:id', authorizeRoles('admin', 'hr', 'manager'), geofenceController.updateGeofence);
router.delete('/:id', authorizeRoles('admin', 'hr'), geofenceController.deleteGeofence);

// Geofence violations
router.get('/violations/list', geofenceController.getGeofenceViolations);
router.post('/violations', geofenceController.createGeofenceViolation);
router.put('/violations/:id/clear', authorizeRoles('admin', 'hr', 'manager'), geofenceController.clearGeofenceViolation);
router.delete('/violations/:id', authorizeRoles('admin', 'hr', 'manager'), geofenceController.deleteGeofenceViolation);
router.put('/violations/user/:userId/clear-all', authorizeRoles('admin', 'hr'), geofenceController.clearAllViolations);

// Employee locations and compliance
router.get('/employees/locations', authorizeRoles('admin', 'hr', 'manager'), geofenceController.getEmployeeLocations);
router.post('/check-compliance', geofenceController.checkGeofenceCompliance);

module.exports = router;
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

// Get all employees for the organization (with hrCode filtering for HR users)
// Cache for 2 minutes
router.get('/', cacheMiddleware(120), employeeController.getEmployees);

// Get multiple employees by IDs (for fetching team members)
router.post('/batch', employeeController.getEmployeesByIds);

// Dashboard endpoints - MUST come before /:id route
// Cache for 5 minutes
router.get('/dashboard', cacheMiddleware(300), employeeController.getDashboardData);
router.get('/dashboard-stats', cacheMiddleware(300), employeeController.getDashboardStats);

// Get employees by specific hrCode (for HR managers)
// Cache for 2 minutes
router.get('/by-hr-code/:hrCode', cacheMiddleware(120), employeeController.getEmployeesByHrCode);

// Get employee by ID - MUST come after specific routes
// Cache for 5 minutes
router.get('/:id', cacheMiddleware(300), employeeController.getEmployeeById);

// Delete employee by ID - Admin and HR only
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
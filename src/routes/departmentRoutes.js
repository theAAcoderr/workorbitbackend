const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/departments/hierarchy/tree
 * @desc    Get department hierarchy tree
 * @access  Private
 */
router.get('/hierarchy/tree', 
  cacheMiddleware(600), 
  departmentController.getDepartmentHierarchy
);

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments for organization
 * @access  Private
 */
router.get('/', 
  cacheMiddleware(300), 
  departmentController.getDepartments
);

/**
 * @route   POST /api/v1/departments
 * @desc    Create a new department
 * @access  Private (Admin, HR)
 */
router.post('/', 
  authorizeRoles('admin', 'hr'), 
  departmentController.createDepartment
);

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
router.get('/:id', 
  cacheMiddleware(300), 
  departmentController.getDepartmentById
);

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department
 * @access  Private (Admin, HR)
 */
router.put('/:id', 
  authorizeRoles('admin', 'hr'), 
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Delete department
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authorizeRoles('admin'), 
  departmentController.deleteDepartment
);

/**
 * @route   GET /api/v1/departments/:id/employees
 * @desc    Get all employees in a department
 * @access  Private
 */
router.get('/:id/employees', 
  cacheMiddleware(180), 
  departmentController.getDepartmentEmployees
);

module.exports = router;


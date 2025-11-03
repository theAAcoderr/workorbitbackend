/**
 * EXAMPLE: Properly Validated Routes
 * Copy this pattern to your existing routes
 */

const express = require('express');
const router = express.Router();

// Controllers
const employeeController = require('../controllers/employeeController');

// Middleware
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Validators (newly created)
const {
  createEmployeeValidators,
  updateEmployeeValidators,
  getEmployeesValidators,
  assignManagerValidators,
  bulkImportValidators
} = require('../middleware/validators/employeeValidators');

const { uuidValidator } = require('../middleware/validators/commonValidators');

// =============================================
// EXAMPLE 1: Simple GET with Pagination
// =============================================
router.get(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'hr', 'manager'),
  getEmployeesValidators, // ← Validates pagination params
  employeeController.getEmployees
);

// =============================================
// EXAMPLE 2: GET by ID with UUID Validation
// =============================================
router.get(
  '/:id',
  authMiddleware,
  uuidValidator, // ← Validates UUID format
  employeeController.getEmployeeById
);

// =============================================
// EXAMPLE 3: POST with Comprehensive Validation
// =============================================
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'hr'),
  createEmployeeValidators, // ← Validates all input fields
  employeeController.createEmployee
);

// =============================================
// EXAMPLE 4: PUT with Update Validation
// =============================================
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'hr'),
  uuidValidator, // ← Validates ID in URL
  updateEmployeeValidators, // ← Validates body fields
  employeeController.updateEmployee
);

// =============================================
// EXAMPLE 5: DELETE with Auth & ID Validation
// =============================================
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'), // ← Only admins can delete
  uuidValidator,
  employeeController.deleteEmployee
);

// =============================================
// EXAMPLE 6: Custom Endpoint with Multiple Validators
// =============================================
router.post(
  '/:id/assign-manager',
  authMiddleware,
  authorizeRoles('admin', 'hr'),
  assignManagerValidators, // ← Custom validation
  employeeController.assignManager
);

// =============================================
// EXAMPLE 7: Bulk Operation with Array Validation
// =============================================
router.post(
  '/bulk-import',
  authMiddleware,
  authorizeRoles('admin'),
  bulkImportValidators, // ← Validates array of employees
  employeeController.bulkImport
);

module.exports = router;

/**
 * HOW TO APPLY TO EXISTING ROUTES:
 * 
 * 1. Import validators at top of file:
 *    const { yourValidators } = require('../middleware/validators/yourValidators');
 * 
 * 2. Add validators to route chain (BEFORE controller):
 *    router.post('/path', authMiddleware, yourValidators, controller.method);
 * 
 * 3. Validators automatically return 400 with error details if validation fails
 * 
 * 4. In controller, data is already validated and sanitized:
 *    const { field1, field2 } = req.body; // Safe to use!
 * 
 * 5. Run tests to verify:
 *    npm test
 */


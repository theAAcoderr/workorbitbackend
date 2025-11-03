/**
 * Employee-specific validators
 */

const { body } = require('express-validator');
const {
  validateRequest,
  emailValidator,
  nameValidator,
  phoneValidator,
  uuidValidator,
  roleValidator,
  paginationValidators
} = require('./commonValidators');

/**
 * Create employee validation
 */
const createEmployeeValidators = [
  ...emailValidator('email'),
  ...nameValidator('name'),
  ...phoneValidator('phone'),
  ...roleValidator,
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must not exceed 100 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
  body('dateOfJoining')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of joining format')
    .toDate(),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth format')
    .toDate()
    .custom((value) => {
      const age = (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        throw new Error('Employee must be at least 18 years old');
      }
      if (age > 100) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number')
    .toFloat(),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object'),
  validateRequest
];

/**
 * Update employee validation
 */
const updateEmployeeValidators = [
  ...uuidValidator,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must not exceed 100 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number')
    .toFloat(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role'),
  validateRequest
];

/**
 * Get employees list validation
 */
const getEmployeesValidators = [
  ...paginationValidators,
  validateRequest
];

/**
 * Assign manager validation
 */
const assignManagerValidators = [
  ...uuidValidator,
  body('managerId')
    .notEmpty()
    .withMessage('Manager ID is required')
    .isUUID()
    .withMessage('Invalid manager ID format')
    .custom((value, { req }) => {
      if (value === req.params.id) {
        throw new Error('Employee cannot be their own manager');
      }
      return true;
    }),
  validateRequest
];

/**
 * Bulk employee import validation
 */
const bulkImportValidators = [
  body('employees')
    .isArray({ min: 1, max: 100 })
    .withMessage('Must provide 1-100 employees'),
  body('employees.*.email')
    .isEmail()
    .withMessage('Invalid email'),
  body('employees.*.name')
    .isLength({ min: 2 })
    .withMessage('Name is required'),
  validateRequest
];

module.exports = {
  createEmployeeValidators,
  updateEmployeeValidators,
  getEmployeesValidators,
  assignManagerValidators,
  bulkImportValidators
};


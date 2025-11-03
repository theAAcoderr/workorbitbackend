/**
 * Common Validation Middleware
 * Uses express-validator for comprehensive input validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * UUID validation
 */
const uuidValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format. Must be a valid UUID')
];

/**
 * Pagination validators
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .trim()
    .matches(/^-?(createdAt|updatedAt|name|email|date)$/)
    .withMessage('Invalid sort field')
];

/**
 * Date range validators
 */
const dateRangeValidators = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),
  query('endDate')
    .optional()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

/**
 * Email validator
 */
const emailValidator = (field = 'email') => [
  body(field)
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .toLowerCase()
];

/**
 * Password validator
 */
const passwordValidator = (field = 'password') => [
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

/**
 * Name validator
 */
const nameValidator = (field = 'name') => [
  body(field)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
];

/**
 * Phone number validator
 */
const phoneValidator = (field = 'phone') => [
  body(field)
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
];

/**
 * Coordinate validators
 */
const coordinateValidators = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat()
];

/**
 * Address validator
 */
const addressValidator = [
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters')
];

/**
 * URL validator
 */
const urlValidator = (field) => [
  body(field)
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid URL format')
];

/**
 * File upload validator
 */
const fileUploadValidator = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file && !req.files) {
        throw new Error('No file uploaded');
      }
      return true;
    })
];

/**
 * Enum validator
 */
const enumValidator = (field, allowedValues) => [
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`)
];

/**
 * Array validator
 */
const arrayValidator = (field, options = {}) => [
  body(field)
    .isArray({ min: options.min || 0, max: options.max || 100 })
    .withMessage(`${field} must be an array with ${options.min || 0}-${options.max || 100} items`)
];

/**
 * Sanitize HTML tags
 */
const sanitizeHtml = (field) => [
  body(field)
    .trim()
    .escape()
];

/**
 * Alphanumeric validator
 */
const alphanumericValidator = (field) => [
  body(field)
    .isAlphanumeric()
    .withMessage(`${field} must contain only letters and numbers`)
];

/**
 * Role validator
 */
const roleValidator = [
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role. Must be one of: admin, hr, manager, employee')
];

/**
 * Status validator
 */
const statusValidator = (allowedStatuses) => [
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`)
];

/**
 * Boolean validator
 */
const booleanValidator = (field) => [
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be a boolean value`)
    .toBoolean()
];

/**
 * Integer validator
 */
const integerValidator = (field, options = {}) => [
  body(field)
    .isInt({ min: options.min, max: options.max })
    .withMessage(`${field} must be an integer${options.min !== undefined ? ` >= ${options.min}` : ''}${options.max !== undefined ? ` and <= ${options.max}` : ''}`)
    .toInt()
];

/**
 * Decimal validator
 */
const decimalValidator = (field, options = {}) => [
  body(field)
    .isDecimal({ decimal_digits: options.decimals || '0,2' })
    .withMessage(`${field} must be a valid decimal number`)
    .toFloat()
];

/**
 * Custom validator wrapper
 */
const customValidator = (field, validatorFn, message) => [
  body(field)
    .custom(validatorFn)
    .withMessage(message)
];

module.exports = {
  validateRequest,
  uuidValidator,
  paginationValidators,
  dateRangeValidators,
  emailValidator,
  passwordValidator,
  nameValidator,
  phoneValidator,
  coordinateValidators,
  addressValidator,
  urlValidator,
  fileUploadValidator,
  enumValidator,
  arrayValidator,
  sanitizeHtml,
  alphanumericValidator,
  roleValidator,
  statusValidator,
  booleanValidator,
  integerValidator,
  decimalValidator,
  customValidator
};


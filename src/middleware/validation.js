const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character (@$!%*?&)'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateOrganizationCreation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Organization name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid organization email'),
  body('industry')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Industry must be at least 2 characters long'),
  handleValidationErrors
];

const validateJoinRequest = [
  body('requestedRole')
    .isIn(['hr', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('requestedOrgCode')
    .optional()
    .trim()
    .matches(/^ORG\d{3}$/)
    .withMessage('Invalid organization code format (e.g., ORG001)'),
  body('requestedHRCode')
    .optional()
    .trim()
    .matches(/^HR\d{3}-ORG\d{3}$/)
    .withMessage('Invalid HR code format (e.g., HR001-ORG001)'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validateNewPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character (@$!%*?&)'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department must be at least 2 characters long'),
  body('designation')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Designation must be at least 2 characters long'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateOrganizationCreation,
  validateJoinRequest,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate,
  handleValidationErrors
};
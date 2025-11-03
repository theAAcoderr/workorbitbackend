const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const createLeaveValidator = [
  body('type')
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('numberOfDays')
    .notEmpty()
    .withMessage('Number of days is required')
    .isFloat({ min: 0.5 })
    .withMessage('Number of days must be at least 0.5'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('managerId')
    .optional()
    .isUUID()
    .withMessage('Manager ID must be a valid UUID'),
  handleValidationErrors
];

const updateLeaveValidator = [
  param('leaveId')
    .isUUID()
    .withMessage('Leave ID must be a valid UUID'),
  body('type')
    .optional()
    .isIn(['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('numberOfDays')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('Number of days must be at least 0.5'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  handleValidationErrors
];

const approveRejectLeaveValidator = [
  param('leaveId')
    .isUUID()
    .withMessage('Leave ID must be a valid UUID'),
  body('comment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
  handleValidationErrors
];

module.exports = {
  createLeaveValidator,
  updateLeaveValidator,
  approveRejectLeaveValidator
};

/**
 * Leave Management Validators
 */

const { body, param } = require('express-validator');
const {
  validateRequest,
  uuidValidator,
  dateRangeValidators,
  paginationValidators
} = require('./commonValidators');

/**
 * Apply leave validation
 */
const applyLeaveValidators = [
  body('leaveType')
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(['sick', 'casual', 'vacation', 'emergency', 'unpaid', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format')
    .toDate()
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (value < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .toDate()
    .custom((value, { req }) => {
      if (value < req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      
      // Check maximum leave duration (e.g., 30 days)
      const maxDays = 30;
      const daysDiff = (value - req.body.startDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > maxDays) {
        throw new Error(`Leave duration cannot exceed ${maxDays} days`);
      }
      
      return true;
    }),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  
  body('halfDay')
    .optional()
    .isBoolean()
    .withMessage('Half day must be a boolean')
    .toBoolean(),
  
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 attachments allowed'),
  
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object'),
  
  validateRequest
];

/**
 * Approve/Reject leave validation
 */
const reviewLeaveValidators = [
  ...uuidValidator,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes must not exceed 500 characters'),
  
  body('approvedDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Approved days must be a positive integer')
    .toInt(),
  
  validateRequest
];

/**
 * Get leave balance validation
 */
const getLeaveBalanceValidators = [
  param('userId')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  validateRequest
];

/**
 * Cancel leave validation
 */
const cancelLeaveValidators = [
  ...uuidValidator,
  body('cancellationReason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Reason must be between 10 and 300 characters'),
  
  validateRequest
];

/**
 * Get leave history validation
 */
const getLeaveHistoryValidators = [
  ...paginationValidators,
  ...dateRangeValidators,
  validateRequest
];

module.exports = {
  applyLeaveValidators,
  reviewLeaveValidators,
  getLeaveBalanceValidators,
  cancelLeaveValidators,
  getLeaveHistoryValidators
};


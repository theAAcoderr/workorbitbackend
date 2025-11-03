/**
 * Attendance-specific validators
 */

const { body, param } = require('express-validator');
const {
  validateRequest,
  coordinateValidators,
  addressValidator,
  uuidValidator,
  dateRangeValidators
} = require('./commonValidators');

/**
 * Check-in validation
 */
const checkInValidators = [
  ...coordinateValidators,
  ...addressValidator,
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Device info must be an object'),
  validateRequest
];

/**
 * Check-out validation
 */
const checkOutValidators = [
  ...coordinateValidators,
  ...addressValidator,
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  validateRequest
];

/**
 * Get attendance validation
 */
const getAttendanceValidators = [
  ...dateRangeValidators,
  validateRequest
];

/**
 * Update attendance validation (admin/hr only)
 */
const updateAttendanceValidators = [
  ...uuidValidator,
  body('checkInTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid check-in time format')
    .toDate(),
  body('checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid check-out time format')
    .toDate(),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half-day', 'leave'])
    .withMessage('Invalid attendance status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  validateRequest
];

/**
 * Bulk attendance upload validation
 */
const bulkAttendanceValidators = [
  body('attendanceData')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Attendance data must be an array with 1-1000 records'),
  body('attendanceData.*.employeeId')
    .isUUID()
    .withMessage('Invalid employee ID'),
  body('attendanceData.*.date')
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  body('attendanceData.*.status')
    .isIn(['present', 'absent', 'late', 'half-day', 'leave'])
    .withMessage('Invalid status'),
  validateRequest
];

module.exports = {
  checkInValidators,
  checkOutValidators,
  getAttendanceValidators,
  updateAttendanceValidators,
  bulkAttendanceValidators
};


const { body, param, query } = require('express-validator');

// Shift validators
const validateCreateShift = [
  body('organizationId')
    .trim()
    .notEmpty()
    .withMessage('Organization ID is required'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shift name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Shift name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]$/)
    .withMessage('Start time must be in H:M or HH:MM format'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]$/)
    .withMessage('End time must be in H:M or HH:MM format'),

  body('durationMinutes')
    .isInt({ min: 0, max: 1440 })
    .withMessage('Duration must be between 0 and 1440 minutes'),

  body('breakMinutes')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Break minutes must be between 0 and 480'),

  body('isNightShift')
    .optional()
    .isBoolean()
    .withMessage('isNightShift must be a boolean'),

  body('color')
    .optional()
    .custom((value) => {
      // Allow hex color strings
      if (typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return true;
      }
      // Allow Flutter color integers (32-bit ARGB values)
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF) {
        return true;
      }
      throw new Error('Color must be a valid hex color string or Flutter color integer');
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('applicableDays')
    .optional()
    .isArray()
    .withMessage('Applicable days must be an array')
    .custom((value) => {
      if (value) {
        for (const day of value) {
          if (typeof day !== 'number' || day < 0 || day > 6) {
            throw new Error('Each day must be a number between 0 and 6');
          }
        }
      }
      return true;
    }),

  body('overtimeAllowed')
    .optional()
    .isBoolean()
    .withMessage('overtimeAllowed must be a boolean'),

  body('overtimeRate')
    .optional()
    .isFloat({ min: 1.0, max: 3.0 })
    .withMessage('Overtime rate must be between 1.0 and 3.0'),

  body('gracePeriodMinutes')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Grace period must be between 0 and 60 minutes'),

  body('minimumStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum staff must be at least 1'),

  body('maximumStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum staff must be at least 1')
];

const validateUpdateShift = [
  param('id')
    .isUUID()
    .withMessage('Invalid shift ID'),

  // All fields are optional for updates
  body('organizationId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization ID cannot be empty'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shift name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Shift name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('startTime')
    .optional()
    .notEmpty()
    .withMessage('Start time cannot be empty')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]$/)
    .withMessage('Start time must be in H:M or HH:MM format'),

  body('endTime')
    .optional()
    .notEmpty()
    .withMessage('End time cannot be empty')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]$/)
    .withMessage('End time must be in H:M or HH:MM format'),

  body('durationMinutes')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Duration must be between 0 and 1440 minutes'),

  body('breakMinutes')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Break minutes must be between 0 and 480'),

  body('isNightShift')
    .optional()
    .isBoolean()
    .withMessage('isNightShift must be a boolean'),

  body('color')
    .optional()
    .custom((value) => {
      // Allow hex color strings
      if (typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return true;
      }
      // Allow Flutter color integers (32-bit ARGB values)
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF) {
        return true;
      }
      throw new Error('Color must be a valid hex color string or Flutter color integer');
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('applicableDays')
    .optional()
    .isArray()
    .withMessage('Applicable days must be an array')
    .custom((value) => {
      if (value) {
        for (const day of value) {
          if (typeof day !== 'number' || day < 0 || day > 6) {
            throw new Error('Each day must be a number between 0 and 6');
          }
        }
      }
      return true;
    }),

  body('overtimeAllowed')
    .optional()
    .isBoolean()
    .withMessage('overtimeAllowed must be a boolean'),

  body('overtimeRate')
    .optional()
    .isFloat({ min: 1.0, max: 3.0 })
    .withMessage('Overtime rate must be between 1.0 and 3.0'),

  body('gracePeriodMinutes')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Grace period must be between 0 and 60 minutes'),

  body('minimumStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum staff must be at least 1'),

  body('maximumStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum staff must be at least 1')
];

// Roster validators
const validateCreateRoster = [
  body('organizationId')
    .trim()
    .notEmpty()
    .withMessage('Organization ID is required'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Roster name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Roster name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate && value < req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('departmentId')
    .optional()
    .trim(),

  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),

  body('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'published', 'archived'])
    .withMessage('Invalid status'),

  body('autoAssignEnabled')
    .optional()
    .isBoolean()
    .withMessage('autoAssignEnabled must be a boolean'),

  body('rotationPattern')
    .optional()
    .isIn(['weekly', 'biweekly', 'monthly', 'custom'])
    .withMessage('Invalid rotation pattern'),

  body('notifyOnPublish')
    .optional()
    .isBoolean()
    .withMessage('notifyOnPublish must be a boolean'),

  body('notifyOnChange')
    .optional()
    .isBoolean()
    .withMessage('notifyOnChange must be a boolean'),

  body('reminderDays')
    .optional()
    .isInt({ min: 0, max: 7 })
    .withMessage('Reminder days must be between 0 and 7')
];

const validateUpdateRoster = [
  param('id')
    .isUUID()
    .withMessage('Invalid roster ID'),

  // All fields are optional for updates
  body('organizationId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization ID cannot be empty'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Roster name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Roster name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('startDate')
    .optional()
    .notEmpty()
    .withMessage('Start date cannot be empty')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .notEmpty()
    .withMessage('End date cannot be empty')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate && value < req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('departmentId')
    .optional()
    .trim(),

  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),

  body('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'published', 'archived'])
    .withMessage('Invalid status'),

  body('autoAssignEnabled')
    .optional()
    .isBoolean()
    .withMessage('autoAssignEnabled must be a boolean'),

  body('rotationPattern')
    .optional()
    .isIn(['weekly', 'biweekly', 'monthly', 'custom'])
    .withMessage('Invalid rotation pattern'),

  body('notifyOnPublish')
    .optional()
    .isBoolean()
    .withMessage('notifyOnPublish must be a boolean'),

  body('notifyOnChange')
    .optional()
    .isBoolean()
    .withMessage('notifyOnChange must be a boolean'),

  body('reminderDays')
    .optional()
    .isInt({ min: 0, max: 7 })
    .withMessage('Reminder days must be between 0 and 7')
];

// Assignment validators
const validateCreateAssignment = [
  body('shiftId')
    .notEmpty()
    .withMessage('Shift ID is required')
    .isUUID()
    .withMessage('Invalid shift ID'),

  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid employee ID'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('rosterId')
    .optional()
    .isUUID()
    .withMessage('Invalid roster ID'),

  body('status')
    .optional()
    .isIn(['assigned', 'confirmed', 'declined', 'swap_requested', 'cancelled'])
    .withMessage('Invalid status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const validateUpdateAssignment = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment ID'),

  body('status')
    .optional()
    .isIn(['assigned', 'confirmed', 'declined', 'swap_requested', 'cancelled'])
    .withMessage('Invalid status'),

  body('actualStartTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Actual start time must be in HH:MM format'),

  body('actualEndTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Actual end time must be in HH:MM format'),

  body('actualBreakMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Actual break minutes must be a positive number'),

  body('overtimeMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Overtime minutes must be a positive number'),

  body('performance')
    .optional()
    .isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'])
    .withMessage('Invalid performance rating'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const validateDeclineAssignment = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Decline reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const validateRequestSwap = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment ID'),

  body('swapWithEmployeeId')
    .notEmpty()
    .withMessage('Employee ID for swap is required')
    .isUUID()
    .withMessage('Invalid employee ID')
];

const validateBulkAssign = [
  body('assignments')
    .isArray({ min: 1 })
    .withMessage('Assignments must be a non-empty array'),

  body('assignments.*.shiftId')
    .notEmpty()
    .withMessage('Shift ID is required')
    .isUUID()
    .withMessage('Invalid shift ID'),

  body('assignments.*.employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid employee ID'),

  body('assignments.*.date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date')
];

// Query validators
const validateShiftQuery = [
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('isNightShift')
    .optional()
    .isBoolean()
    .withMessage('isNightShift must be a boolean'),

  query('hrCode')
    .optional()
    .trim()
];

const validateRosterQuery = [
  query('departmentId')
    .optional()
    .trim(),

  query('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'published', 'archived'])
    .withMessage('Invalid status'),

  query('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('hrCode')
    .optional()
    .trim()
];

const validateAssignmentQuery = [
  query('employeeId')
    .optional()
    .isUUID()
    .withMessage('Invalid employee ID'),

  query('shiftId')
    .optional()
    .isUUID()
    .withMessage('Invalid shift ID'),

  query('rosterId')
    .optional()
    .isUUID()
    .withMessage('Invalid roster ID'),

  query('status')
    .optional()
    .isIn(['assigned', 'confirmed', 'declined', 'swap_requested', 'cancelled'])
    .withMessage('Invalid status'),

  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('hrCode')
    .optional()
    .trim()
];

const validateScheduleQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date')
];

const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID')
];

module.exports = {
  validateCreateShift,
  validateUpdateShift,
  validateCreateRoster,
  validateUpdateRoster,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateDeclineAssignment,
  validateRequestSwap,
  validateBulkAssign,
  validateShiftQuery,
  validateRosterQuery,
  validateAssignmentQuery,
  validateScheduleQuery,
  validateIdParam
};
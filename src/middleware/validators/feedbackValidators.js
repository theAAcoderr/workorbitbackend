const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validators for creating feedback
const createFeedbackValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),

  body('type')
    .optional()
    .isIn(['positive', 'constructive', 'general'])
    .withMessage('Type must be one of: positive, constructive, general'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('recipientId')
    .notEmpty()
    .withMessage('Recipient ID is required')
    .isUUID()
    .withMessage('Recipient ID must be a valid UUID'),

  body('visibility')
    .optional()
    .isIn(['private', 'team', 'public'])
    .withMessage('Visibility must be one of: private, team, public'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  validate
];

// Validators for updating feedback
const updateFeedbackValidators = [
  param('id')
    .isUUID()
    .withMessage('Feedback ID must be a valid UUID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),

  body('message')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),

  body('type')
    .optional()
    .isIn(['positive', 'constructive', 'general'])
    .withMessage('Type must be one of: positive, constructive, general'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('visibility')
    .optional()
    .isIn(['private', 'team', 'public'])
    .withMessage('Visibility must be one of: private, team, public'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  validate
];

// Validators for getting feedback by ID
const getFeedbackByIdValidators = [
  param('id')
    .isUUID()
    .withMessage('Feedback ID must be a valid UUID'),

  validate
];

// Validators for acknowledging feedback
const acknowledgeFeedbackValidators = [
  param('id')
    .isUUID()
    .withMessage('Feedback ID must be a valid UUID'),

  validate
];

// Validators for archiving feedback
const archiveFeedbackValidators = [
  param('id')
    .isUUID()
    .withMessage('Feedback ID must be a valid UUID'),

  validate
];

// Validators for getting feedback list with query params
const getFeedbackListValidators = [
  query('type')
    .optional()
    .isIn(['positive', 'constructive', 'general'])
    .withMessage('Type must be one of: positive, constructive, general'),

  query('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'archived'])
    .withMessage('Status must be one of: pending, acknowledged, archived'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'type', 'status'])
    .withMessage('SortBy must be one of: createdAt, updatedAt, title, type, status'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('SortOrder must be either ASC or DESC'),

  validate
];

// Validators for getting team member feedback
const getTeamMemberFeedbackValidators = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),

  query('type')
    .optional()
    .isIn(['positive', 'constructive', 'general'])
    .withMessage('Type must be one of: positive, constructive, general'),

  query('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'archived'])
    .withMessage('Status must be one of: pending, acknowledged, archived'),

  validate
];

module.exports = {
  createFeedbackValidators,
  updateFeedbackValidators,
  getFeedbackByIdValidators,
  acknowledgeFeedbackValidators,
  archiveFeedbackValidators,
  getFeedbackListValidators,
  getTeamMemberFeedbackValidators
};

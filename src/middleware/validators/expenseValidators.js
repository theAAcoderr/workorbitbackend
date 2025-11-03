const { body, param, query } = require('express-validator');

exports.createExpenseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['travel', 'food', 'accommodation', 'supplies', 'equipment', 'fuel', 'entertainment', 'communication', 'training', 'medical', 'other'])
    .withMessage('Invalid category'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),

  body('expenseDate')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  body('receiptNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Receipt number must not exceed 100 characters'),

  body('vendor')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Vendor name must not exceed 200 characters'),

  body('projectId')
    .optional()
    .isUUID()
    .withMessage('Invalid project ID'),

  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'mobile_payment', 'other'])
    .withMessage('Invalid payment method'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

exports.updateExpenseValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('category')
    .optional()
    .isIn(['travel', 'food', 'accommodation', 'supplies', 'equipment', 'fuel', 'entertainment', 'communication', 'training', 'medical', 'other'])
    .withMessage('Invalid category'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    })
];

exports.reviewExpenseValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either "approved" or "rejected"'),

  body('reviewComments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review comments must not exceed 1000 characters')
];

exports.getExpenseByIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID')
];

exports.getExpensesQueryValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),

  query('category')
    .optional()
    .isIn(['travel', 'food', 'accommodation', 'supplies', 'equipment', 'fuel', 'entertainment', 'communication', 'training', 'medical', 'other'])
    .withMessage('Invalid category'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),

  query('employeeId')
    .optional()
    .isUUID()
    .withMessage('Invalid employee ID')
];
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const {
  createExpenseValidator,
  updateExpenseValidator,
  reviewExpenseValidator,
  getExpenseByIdValidator,
  getExpensesQueryValidator
} = require('../middleware/validators/expenseValidators');

// Validation error handler middleware
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

// All routes require authentication
router.use(authMiddleware);

// Get expense statistics
router.get('/stats', expenseController.getExpenseStats);

// Get pending approvals (managers/HR)
router.get(
  '/pending-approvals',
  authorizeRoles('manager', 'hr', 'admin'),
  expenseController.getPendingApprovals
);

// Get all expenses (filtered by role)
router.get(
  '/',
  getExpensesQueryValidator,
  handleValidationErrors,
  expenseController.getAllExpenses
);

// Get single expense
router.get(
  '/:id',
  getExpenseByIdValidator,
  handleValidationErrors,
  expenseController.getExpenseById
);

// Create new expense (all authenticated users)
router.post(
  '/',
  createExpenseValidator,
  handleValidationErrors,
  expenseController.createExpense
);

// Update expense (only owner, only if pending)
router.put(
  '/:id',
  updateExpenseValidator,
  handleValidationErrors,
  expenseController.updateExpense
);

// Delete expense (only owner, only if pending)
router.delete(
  '/:id',
  getExpenseByIdValidator,
  handleValidationErrors,
  expenseController.deleteExpense
);

// Review expense (approve/reject) - managers/HR/admin only
router.post(
  '/:id/review',
  authorizeRoles('manager', 'hr', 'admin'),
  reviewExpenseValidator,
  handleValidationErrors,
  expenseController.reviewExpense
);

module.exports = router;
const { Expense, User } = require('../models');
const { Op } = require('sequelize');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

// Get all expenses (filtered by role)
exports.getAllExpenses = async (req, res) => {
  try {
    const { status, category, startDate, endDate, employeeId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const whereClause = { organizationId };

    // Role-based filtering
    if (userRole === 'employee') {
      whereClause.employeeId = userId;
    } else if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(s => s.id);
      whereClause.employeeId = { [Op.in]: [userId, ...subordinateIds] };
    }

    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (employeeId && (userRole === 'hr' || userRole === 'admin' || userRole === 'manager')) {
      whereClause.employeeId = employeeId;
    }
    if (startDate || endDate) {
      whereClause.expenseDate = {};
      if (startDate) whereClause.expenseDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.expenseDate[Op.lte] = new Date(endDate);
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['submittedDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Get single expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const expense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId', 'managerId']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const canAccess =
      userRole === 'admin' ||
      userRole === 'hr' ||
      expense.employeeId === userId ||
      (userRole === 'manager' && expense.employee.managerId === userId);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const expenseData = {
      ...req.body,
      employeeId: userId,
      organizationId,
      status: 'pending',
      submittedDate: new Date()
    };

    const expense = await Expense.create(expenseData);

    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        }
      ]
    });

    // 🔔 ADMIN NOTIFICATION: High-value expense check
    const HIGH_VALUE_THRESHOLD = 10000;
    if (expense.amount > HIGH_VALUE_THRESHOLD) {
      await adminNotificationService.notifyHighValueExpense(
        organizationId,
        {
          expenseId: expense.id,
          employeeId: req.user.id,
          employeeName: req.user.name,
          amount: expense.amount,
          expenseCategory: expense.category,
          threshold: HIGH_VALUE_THRESHOLD
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    // Send notification to manager and HR
    try {
      // Notify manager if exists
      if (req.user.managerId) {
        await oneSignalService.sendToUser(
          req.user.managerId.toString(),
          {
            title: '💵 New Expense Submitted',
            message: `${req.user.name} submitted expense of ₹${expense.amount} for ${expense.category}`,
            data: {
              type: 'expense_submitted',
              expenseId: expense.id,
              employeeName: req.user.name,
              amount: expense.amount,
              category: expense.category,
              timestamp: new Date().toISOString()
            }
          }
        );
      }

      // Notify HR
      await oneSignalService.sendToRole(
        organizationId,
        'hr',
        {
          title: `💵 New Expense - ${req.user.name}`,
          message: `Expense of ₹${expense.amount} for ${expense.category}`,
          data: {
            type: 'expense_submitted',
            expenseId: expense.id,
            employeeName: req.user.name,
            amount: expense.amount,
            category: expense.category,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log('✅ Expense submission notifications sent to manager and HR');
    } catch (notificationError) {
      console.error('⚠️ Failed to send expense submission notifications:', notificationError);
      // Don't fail the expense creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Expense claim created successfully',
      data: createdExpense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense claim',
      error: error.message
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.employeeId !== userId || expense.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'You cannot update this expense'
      });
    }

    await expense.update(req.body);

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.employeeId !== userId || expense.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete this expense'
      });
    }

    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Approve or reject expense
exports.reviewExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const expense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'managerId']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenses can be reviewed'
      });
    }

    const canReview =
      userRole === 'admin' ||
      userRole === 'hr' ||
      (userRole === 'manager' && expense.employee.managerId === userId);

    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to review this expense'
      });
    }

    await expense.update({
      status,
      reviewComments,
      reviewedBy: userId,
      reviewedDate: new Date()
    });

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Send notification to employee about review decision
    try {
      const notificationTitle = status === 'approved'
        ? '✅ Expense Approved'
        : '❌ Expense Rejected';
      const notificationMessage = status === 'approved'
        ? `Your ${expense.category} expense of ₹${expense.amount} has been approved by ${req.user.name}`
        : `Your ${expense.category} expense of ₹${expense.amount} was rejected by ${req.user.name}`;

      await oneSignalService.sendToUser(
        expense.employeeId.toString(),
        {
          title: notificationTitle,
          message: notificationMessage,
          data: {
            type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
            expenseId: expense.id,
            amount: expense.amount,
            category: expense.category,
            reviewedBy: req.user.name,
            reviewComments: reviewComments || '',
            status: status,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Expense ${status} notification sent to employee ${expense.employeeId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send expense review notification:', notificationError);
      // Don't fail the expense review if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Expense ${status} successfully`,
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error reviewing expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review expense',
      error: error.message
    });
  }
};

// Get pending approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const whereClause = {
      organizationId,
      status: 'pending'
    };

    if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(s => s.id);
      whereClause.employeeId = { [Op.in]: subordinateIds };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        }
      ],
      order: [['submittedDate', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

// Get expense statistics
exports.getExpenseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const whereClause = { organizationId };

    if (userRole === 'employee') {
      whereClause.employeeId = userId;
    } else if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(s => s.id);
      whereClause.employeeId = { [Op.in]: [userId, ...subordinateIds] };
    }

    const [total, pending, approved, rejected] = await Promise.all([
      Expense.count({ where: whereClause }),
      Expense.count({ where: { ...whereClause, status: 'pending' } }),
      Expense.count({ where: { ...whereClause, status: 'approved' } }),
      Expense.count({ where: { ...whereClause, status: 'rejected' } })
    ]);

    const totalAmount = await Expense.sum('amount', { where: whereClause }) || 0;
    const approvedAmount = await Expense.sum('amount', {
      where: { ...whereClause, status: 'approved' }
    }) || 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        totalAmount: parseFloat(totalAmount).toFixed(2),
        approvedAmount: parseFloat(approvedAmount).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics',
      error: error.message
    });
  }
};
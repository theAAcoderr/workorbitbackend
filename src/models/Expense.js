const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: {
        args: [3, 200],
        msg: 'Title must be between 3 and 200 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'travel',
      'food',
      'accommodation',
      'supplies',
      'equipment',
      'fuel',
      'entertainment',
      'communication',
      'training',
      'medical',
      'other'
    ),
    allowNull: false,
    defaultValue: 'other'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Amount must be greater than 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  expenseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      notInFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('Expense date cannot be in the future');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  submittedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of file URLs for receipts/invoices'
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vendor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Projects',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'mobile_payment', 'other'),
    allowNull: true
  },
  reimbursementStatus: {
    type: DataTypes.ENUM('not_reimbursed', 'processing', 'reimbursed'),
    allowNull: false,
    defaultValue: 'not_reimbursed'
  },
  reimbursementDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reimbursementReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'Expenses',
  indexes: [
    { fields: ['employeeId'] },
    { fields: ['organizationId'] },
    { fields: ['status'] },
    { fields: ['expenseDate'] },
    { fields: ['category'] },
    { fields: ['projectId'] },
    { fields: ['departmentId'] },
    { fields: ['reviewedBy'] },
    { fields: ['submittedDate'] }
  ]
});

// Instance methods
Expense.prototype.canBeEditedBy = function(userId) {
  return this.employeeId === userId && this.status === 'pending';
};

Expense.prototype.canBeCancelledBy = function(userId) {
  return this.employeeId === userId && this.status === 'pending';
};

Expense.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());

  // Add virtual fields
  values.isEditable = this.status === 'pending';
  values.isCancellable = this.status === 'pending';

  return values;
};

module.exports = Expense;
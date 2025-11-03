const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2020,
      max: 2100
    }
  },
  basicSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  hra: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'House Rent Allowance'
  },
  da: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Dearness Allowance'
  },
  otherAllowances: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pf: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Provident Fund'
  },
  esi: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Employee State Insurance'
  },
  professionalTax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  incomeTax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  otherDeductions: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  grossSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  netPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  workingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  presentDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  absentDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  paidLeaves: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unpaidLeaves: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  overtimeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'approved', 'paid', 'cancelled', 'on-hold'),
    defaultValue: 'draft'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'cheque', 'online'),
    allowNull: true
  },
  bankAccount: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ifscCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payrolls',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employeeId', 'month', 'year', 'organizationId']
    },
    {
      fields: ['organizationId', 'status']
    },
    {
      fields: ['month', 'year']
    }
  ],
  hooks: {
    beforeValidate: (payroll) => {
      // Calculate gross salary
      payroll.grossSalary = parseFloat(payroll.basicSalary || 0) +
                            parseFloat(payroll.hra || 0) +
                            parseFloat(payroll.da || 0) +
                            parseFloat(payroll.otherAllowances || 0) +
                            parseFloat(payroll.overtimeAmount || 0);

      // Calculate total deductions
      payroll.totalDeductions = parseFloat(payroll.pf || 0) +
                                parseFloat(payroll.esi || 0) +
                                parseFloat(payroll.professionalTax || 0) +
                                parseFloat(payroll.incomeTax || 0) +
                                parseFloat(payroll.otherDeductions || 0);

      // Calculate net pay
      payroll.netPay = payroll.grossSalary - payroll.totalDeductions;
    }
  }
});

module.exports = Payroll;
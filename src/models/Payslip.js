const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payrollId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'payrolls',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  month: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  basicSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  grossSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  netPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deductions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'JSON object containing all deductions'
  },
  allowances: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'JSON object containing all allowances'
  },
  deductionsTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  allowancesTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('generated', 'sent', 'viewed', 'downloaded'),
    defaultValue: 'generated'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentTo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email address where payslip was sent'
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  downloadedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidOn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'payslips',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['payrollId', 'employeeId']
    },
    {
      fields: ['employeeId', 'year', 'month']
    },
    {
      fields: ['organizationId', 'status']
    }
  ]
});

module.exports = Payslip;
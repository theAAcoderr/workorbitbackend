const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeavePolicy = sequelize.define('LeavePolicy', {
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
  leaveType: {
    type: DataTypes.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
    allowNull: false
  },
  annualQuota: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  monthlyAccrual: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  maxCarryForward: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  minDaysRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  maxConsecutiveDays: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  requiresAttachment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attachmentRequiredAfterDays: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allowHalfDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  noticePeriodDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rules: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['organizationId', 'leaveType']
    },
    {
      fields: ['organizationId', 'isActive']
    }
  ]
});

module.exports = LeavePolicy;
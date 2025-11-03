const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: new Date().getFullYear()
  },
  leaveType: {
    type: DataTypes.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
    allowNull: false
  },
  totalAllowed: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  used: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  pending: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  available: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  carriedForward: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employeeId', 'organizationId', 'year', 'leaveType']
    },
    {
      fields: ['employeeId', 'year']
    },
    {
      fields: ['organizationId']
    }
  ]
});

module.exports = LeaveBalance;
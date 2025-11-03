const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Leave = sequelize.define('Leave', {
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
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  hrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  teamId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  departmentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  numberOfDays: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  duration: {
    type: DataTypes.ENUM('fullDay', 'halfDay'),
    defaultValue: 'fullDay'
  },
  halfDayPeriod: {
    type: DataTypes.ENUM('firstHalf', 'secondHalf'),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'withdrawn'),
    defaultValue: 'pending'
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
  approverComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvalHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['employeeId', 'status']
    },
    {
      fields: ['organizationId', 'status']
    },
    {
      fields: ['managerId', 'status']
    },
    {
      fields: ['startDate', 'endDate']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Leave;
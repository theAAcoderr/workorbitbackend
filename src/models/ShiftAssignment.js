const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftAssignment = sequelize.define('ShiftAssignment', {
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
  hrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rosterId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ShiftRosters',
      key: 'id'
    }
  },
  shiftId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Shifts',
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // Assignment status
  status: {
    type: DataTypes.ENUM('assigned', 'confirmed', 'declined', 'swap_requested', 'cancelled'),
    defaultValue: 'assigned'
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  declinedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  declineReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Swap request details
  swapRequestedWith: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  swapRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  swapApprovedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  swapApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Actual work tracking
  actualStartTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  actualEndTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  actualBreakMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  overtimeMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Check-in/out locations
  checkInLocation: {
    type: DataTypes.JSON,
    allowNull: true // { latitude, longitude, address }
  },
  checkOutLocation: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Performance tracking
  performance: {
    type: DataTypes.ENUM('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Notification tracking
  notificationsSent: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of { type, sentAt, status }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['hrCode']
    },
    {
      fields: ['rosterId']
    },
    {
      fields: ['shiftId']
    },
    {
      fields: ['employeeId']
    },
    {
      fields: ['date']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['employeeId', 'date', 'shiftId'] // One shift per employee per date
    },
    {
      fields: ['employeeId', 'date']
    },
    {
      fields: ['organizationId', 'date']
    }
  ]
});

module.exports = ShiftAssignment;
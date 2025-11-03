const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shift = sequelize.define('Shift', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 1440 // 24 hours
    }
  },
  breakMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 480 // 8 hours max break
    }
  },
  isNightShift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#2196F3' // Default blue color
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Days of the week this shift applies to (JSON array of integers 0-6, where 0 is Sunday)
  applicableDays: {
    type: DataTypes.JSON,
    defaultValue: [1, 2, 3, 4, 5] // Monday to Friday by default
  },
  // Overtime configuration
  overtimeAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  overtimeRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.5,
    validate: {
      min: 1.0,
      max: 3.0
    }
  },
  // Grace period in minutes for late check-in
  gracePeriodMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    validate: {
      min: 0,
      max: 60
    }
  },
  // Minimum staff required for this shift
  minimumStaff: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  // Maximum staff allowed for this shift
  maximumStaff: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
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
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['hrCode']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['organizationId', 'isActive']
    }
  ]
});

module.exports = Shift;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftRoster = sequelize.define('ShiftRoster', {
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
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (this.startDate && value < this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  departmentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Approval workflow
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'published', 'archived'),
    defaultValue: 'draft'
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
  // Roster rules
  autoAssignEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rotationPattern: {
    type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
    defaultValue: 'weekly'
  },
  // Notification settings
  notifyOnPublish: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifyOnChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reminderDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // Remind 1 day before shift
    validate: {
      min: 0,
      max: 7
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
  paranoid: true,
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['hrCode']
    },
    {
      fields: ['departmentId']
    },
    {
      fields: ['startDate', 'endDate']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isPublished']
    }
  ]
});

module.exports = ShiftRoster;
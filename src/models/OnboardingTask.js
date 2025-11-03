const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OnboardingTask = sequelize.define('OnboardingTask', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Task title is required'
      },
      len: {
        args: [1, 200],
        msg: 'Title must be between 1 and 200 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('Profile', 'Documents', 'Training', 'Setup', 'Compliance', 'General'),
    allowNull: false,
    defaultValue: 'General'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  mandatory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dueInDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Days from user creation when this task is due'
  },
  assignToRoles: {
    type: DataTypes.JSONB,
    defaultValue: ['employee'],
    comment: 'Array of roles: employee, manager, hr, admin'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resourceLinks: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of objects: [{title: string, url: string}]'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'OnboardingTasks',
  timestamps: true,
  indexes: [
    {
      fields: ['organizationId', 'isActive', 'order']
    },
    {
      fields: ['category']
    },
    {
      fields: ['assignToRoles'],
      using: 'gin'
    }
  ]
});

module.exports = OnboardingTask;

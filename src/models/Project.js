const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'onHold', 'completed', 'cancelled', 'archived'),
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  projectManagerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  teamMemberIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  departmentIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0
  },
  spentBudget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  tagIds: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  completionPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
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
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      allowTaskCreation: true,
      requireApproval: false,
      notifyOnTaskComplete: true,
      notifyOnComment: true,
      autoAssignSubtasks: false,
      permissions: {}
    }
  }
}, {
  tableName: 'projects',
  timestamps: true
});

module.exports = Project;
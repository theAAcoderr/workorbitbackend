const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProgressReport = sequelize.define('ProgressReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  projectName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  taskName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reportDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  hoursWorked: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 24
    }
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  challenges: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrls: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  documentUrls: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'reviewed', 'approved'),
    defaultValue: 'submitted'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['projectId']
    },
    {
      fields: ['taskId']
    },
    {
      fields: ['reportDate']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = ProgressReport;
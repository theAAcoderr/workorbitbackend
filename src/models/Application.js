const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trackingCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  securityPin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  candidateInfo: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  resume: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'On Hold'),
    defaultValue: 'Applied'
  },
  statusHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  additionalInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  documents: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scoreMatch: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'applications',
  timestamps: true,
  hooks: {
    beforeCreate: (application) => {
      if (!application.trackingCode) {
        application.trackingCode = 'APP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      if (!application.securityPin) {
        application.securityPin = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }
  },
  indexes: [
    {
      fields: ['trackingCode']
    },
    {
      fields: ['jobId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['appliedAt']
    }
  ]
});

module.exports = Application;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceReview = sequelize.define('PerformanceReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // Employee being reviewed
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  // Reviewer (manager/supervisor)
  reviewerId: {
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

  // Review details
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  reviewPeriod: {
    type: DataTypes.STRING, // e.g., "Q1 2025", "January 2025"
    allowNull: false
  },

  reviewDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // Performance metrics
  overallScore: {
    type: DataTypes.DECIMAL(3, 2), // 0.00 to 5.00
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },

  // Individual ratings
  ratings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Object with categories and scores, e.g., {productivity: 4.5, teamwork: 4.0, quality: 4.5}'
  },

  // Comments and feedback
  strengths: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  areasForImprovement: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  goals: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of goals for next review period'
  },

  // Status tracking
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'in_progress', 'completed', 'acknowledged'),
    defaultValue: 'draft',
    allowNull: false
  },

  // Acknowledgment
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  employeeComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Employee response/comments on the review'
  },

  // Additional metadata
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'PerformanceReviews',
  timestamps: true,
  indexes: [
    { fields: ['employeeId'] },
    { fields: ['reviewerId'] },
    { fields: ['organizationId'] },
    { fields: ['status'] },
    { fields: ['reviewDate'] }
  ]
});

module.exports = PerformanceReview;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in hours
    allowNull: true
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  },
  content: {
    type: DataTypes.JSON, // Course modules, lessons, etc.
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  materialUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  certificateTemplate: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  instructorName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maxEnrollments: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['category']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Course;
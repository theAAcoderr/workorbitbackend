const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseEnrollment = sequelize.define('CourseEnrollment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('enrolled', 'in_progress', 'completed', 'dropped'),
    defaultValue: 'enrolled'
  },
  progress: {
    type: DataTypes.INTEGER, // Progress percentage 0-100
    defaultValue: 0
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  certificateUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER, // 1-5 stars
    allowNull: true
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['courseId', 'userId'],
      unique: true
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = CourseEnrollment;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyPlanReport = sequelize.define('DailyPlanReport', {
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
  attendanceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Attendances',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dailyPlan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dailyReport: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPlanSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isReportSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  planSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reportSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'plan_submitted', 'report_submitted', 'completed'),
    defaultValue: 'pending'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date']
    },
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = DailyPlanReport;
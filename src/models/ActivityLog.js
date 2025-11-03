const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
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
  activityType: {
    type: DataTypes.ENUM('check_in', 'check_out', 'location_update', 'idle_start', 'idle_end', 'travel', 'work', 'break', 'geofence_enter', 'geofence_exit', 'violation'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.JSON, // {latitude, longitude, address}
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes for activities that have duration
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON, // Additional data specific to the activity
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'timestamp']
    },
    {
      fields: ['attendanceId']
    },
    {
      fields: ['activityType']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = ActivityLog;
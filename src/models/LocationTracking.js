const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LocationTracking = sequelize.define('LocationTracking', {
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
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  altitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  heading: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activityType: {
    type: DataTypes.ENUM('stationary', 'walking', 'running', 'driving', 'unknown', 'location_update'),
    defaultValue: 'unknown'
  },
  batteryLevel: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  isBackground: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isWithinGeofence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  currentZone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  distanceFromOffice: {
    type: DataTypes.FLOAT,
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
      fields: ['timestamp']
    }
  ]
});

module.exports = LocationTracking;
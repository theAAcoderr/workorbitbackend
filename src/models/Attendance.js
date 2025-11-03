const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkInLocation: {
    type: DataTypes.JSON, // {latitude, longitude, address, accuracy}
    allowNull: true
  },
  checkOutLocation: {
    type: DataTypes.JSON, // {latitude, longitude, address, accuracy}
    allowNull: true
  },
  totalDuration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'checked_in', 'checked_out', 'partial'),
    defaultValue: 'absent'
  },
  isGeofenceCompliant: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  geofenceOverrideReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  batteryLevel: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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

module.exports = Attendance;
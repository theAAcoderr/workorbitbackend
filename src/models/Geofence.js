const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Geofence = sequelize.define('Geofence', {
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
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  radius: {
    type: DataTypes.FLOAT, // Radius in meters
    allowNull: false,
    defaultValue: 100
  },
  zoneType: {
    type: DataTypes.ENUM('office', 'client', 'home', 'warehouse', 'site'),
    defaultValue: 'office'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowCheckIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowCheckOut: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  workingHours: {
    type: DataTypes.JSON, // {start: "09:00", end: "18:00", days: ["monday", "tuesday", ...]}
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['zoneType']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Geofence;
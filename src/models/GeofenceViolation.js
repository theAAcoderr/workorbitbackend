const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GeofenceViolation = sequelize.define('GeofenceViolation', {
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
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
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
  geofenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Geofences',
      key: 'id'
    }
  },
  violationType: {
    type: DataTypes.ENUM('check_in_outside', 'check_out_outside', 'unauthorized_location'),
    allowNull: false
  },
  violationTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  location: {
    type: DataTypes.JSON, // {latitude, longitude, address}
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT, // Distance from nearest geofence in meters
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  overrideReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isOverridden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  overriddenBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  overriddenAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'resolved'),
    defaultValue: 'pending'
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolutionNotes: {
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
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['violationType']
    }
  ]
});

module.exports = GeofenceViolation;
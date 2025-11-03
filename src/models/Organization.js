const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orgCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '18:00' },
      timeZone: 'UTC',
      currency: 'INR',
      dateFormat: 'MM/DD/YYYY',
      leavePolicy: {},
      attendancePolicy: {}
    }
  },
  subscription: {
    type: DataTypes.JSON,
    defaultValue: {
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      endDate: null,
      maxEmployees: 50
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Organization;
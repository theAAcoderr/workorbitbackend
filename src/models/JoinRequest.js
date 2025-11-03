const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JoinRequest = sequelize.define('JoinRequest', {
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
  requestType: {
    type: DataTypes.ENUM('hr_join', 'staff_join'),
    allowNull: false
  },
  requestedRole: {
    type: DataTypes.ENUM('hr', 'manager', 'employee'),
    allowNull: false
  },
  requestedOrgCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestedHRCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  requestMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = JoinRequest;
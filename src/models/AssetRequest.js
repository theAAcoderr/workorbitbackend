const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AssetRequest = sequelize.define('AssetRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requestType: {
    type: DataTypes.ENUM('new_asset', 'return_asset', 'replacement', 'repair'),
    allowNull: false
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'For return, replacement, or repair requests'
  },
  requestedCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For new asset requests'
  },
  requestedById: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Employee requesting the asset'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  approvedById: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
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
    { fields: ['organizationId'] },
    { fields: ['requestedById'] },
    { fields: ['status'] },
    { fields: ['requestType'] }
  ]
});

module.exports = AssetRequest;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PolicyAcknowledgment = sequelize.define('PolicyAcknowledgment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  policyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'policies',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'policy_acknowledgments',
  timestamps: false,
  indexes: [
    { fields: ['policyId'] },
    { fields: ['userId'] },
    { fields: ['policyId', 'userId'], unique: true }
  ]
});

module.exports = PolicyAcknowledgment;

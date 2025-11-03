const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * SystemActivityLog Model
 * General system activity logging for tracking all user actions
 * Different from ActivityLog which is attendance-specific
 */
const SystemActivityLog = sequelize.define('SystemActivityLog', {
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
    },
    comment: 'User who performed the action'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    },
    comment: 'Organization context'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Action performed: create, update, delete, login, logout, etc.'
  },
  entityType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Type of entity: user, project, task, leave, attendance, form, etc.'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the entity affected'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-readable description of the activity'
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional details about the activity'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the user'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  }
}, {
  tableName: 'system_activity_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['organizationId', 'createdAt']
    },
    {
      fields: ['action']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = SystemActivityLog;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'department', 'role', 'specific'),
    defaultValue: 'all',
  },
  targetDepartment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  tableName: 'announcements',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['priority'] },
    { fields: ['targetAudience'] },
    { fields: ['isPinned'] },
    { fields: ['isActive'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Announcement;

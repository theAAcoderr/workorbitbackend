const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Compliance = sequelize.define('Compliance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM(
      'Certification',
      'License',
      'Policy',
      'Training',
      'Audit',
      'Insurance',
      'Other'
    ),
    allowNull: false,
    defaultValue: 'Other',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expiring Soon', 'Expired', 'Pending', 'Renewed'),
    allowNull: false,
    defaultValue: 'Active',
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reminderDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Days before expiry to send reminder',
  },
  issuingAuthority: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  certificateNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'compliances',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['expiryDate'] },
    { fields: ['assignedTo'] },
    { fields: ['isActive'] },
  ],
});

module.exports = Compliance;

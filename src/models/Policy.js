const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Policy title is required' },
      len: { args: [3, 200], msg: 'Title must be between 3 and 200 characters' }
    }
  },
  category: {
    type: DataTypes.ENUM('HR', 'IT', 'Security', 'Code of Conduct', 'Safety', 'Other'),
    defaultValue: 'Other',
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Policy content is required' }
    }
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isMandatory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'policies',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['category'] },
    { fields: ['isActive'] },
    { fields: ['isMandatory'] },
    { fields: ['effectiveDate'] },
    { fields: ['organizationId', 'isActive'] }
  ]
});

// Model associations
Policy.associate = (models) => {
  Policy.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  Policy.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  Policy.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });

  // Many-to-Many relationship with Users for acknowledgment
  Policy.belongsToMany(models.User, {
    through: 'PolicyAcknowledgments',
    foreignKey: 'policyId',
    otherKey: 'userId',
    as: 'acknowledgedBy'
  });
};

module.exports = Policy;

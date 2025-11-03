const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Holiday = sequelize.define('Holiday', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Holiday name is required' },
      len: { args: [2, 100], msg: 'Holiday name must be between 2 and 100 characters' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Holiday date is required' },
      isDate: { msg: 'Invalid date format' }
    }
  },
  type: {
    type: DataTypes.ENUM('public', 'company', 'optional'),
    defaultValue: 'company',
    allowNull: false
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'holidays',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['date'] },
    { fields: ['type'] },
    { fields: ['isActive'] },
    { fields: ['organizationId', 'date'] }
  ]
});

// Model associations
Holiday.associate = (models) => {
  Holiday.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  Holiday.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

module.exports = Holiday;

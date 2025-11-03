const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalaryStructure = sequelize.define('SalaryStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  basicSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  effectiveDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ctc: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Cost to Company (Annual)'
  }
}, {
  tableName: 'salary_structures',
  timestamps: true,
  indexes: [
    {
      fields: ['employeeId', 'isActive']
    },
    {
      fields: ['organizationId', 'effectiveDate']
    }
  ]
});

module.exports = SalaryStructure;
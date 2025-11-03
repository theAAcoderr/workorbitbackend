const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalaryComponent = sequelize.define('SalaryComponent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  salaryStructureId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'salary_structures',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  componentType: {
    type: DataTypes.ENUM('allowance', 'deduction'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  calculationType: {
    type: DataTypes.ENUM('fixed', 'percentage'),
    allowNull: false,
    defaultValue: 'fixed'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Fixed amount if calculationType is fixed'
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Percentage of basic salary if calculationType is percentage'
  },
  isStatutory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a statutory component like PF, ESI'
  },
  isTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'salary_components',
  timestamps: true,
  indexes: [
    {
      fields: ['salaryStructureId', 'componentType']
    }
  ]
});

module.exports = SalaryComponent;
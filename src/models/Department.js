const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Department name is required' },
      len: {
        args: [2, 100],
        msg: 'Department name must be between 2 and 100 characters'
      }
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Department code is required' },
      isUppercase: { msg: 'Department code must be uppercase' },
      len: {
        args: [2, 20],
        msg: 'Department code must be between 2 and 20 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  parentDepartmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  budgetAllocated: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Budget cannot be negative' }
    }
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Employee count cannot be negative' }
    }
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'departments',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['managerId'] },
    { fields: ['code'], unique: true },
    { fields: ['parentDepartmentId'] },
    { fields: ['isActive'] }
  ]
});

// Class methods
Department.associate = (models) => {
  // Belongs to Organization
  Department.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Belongs to User (Manager)
  Department.belongsTo(models.User, {
    foreignKey: 'managerId',
    as: 'manager'
  });

  // Self-referential for parent department
  Department.belongsTo(Department, {
    foreignKey: 'parentDepartmentId',
    as: 'parentDepartment'
  });

  // Has many sub-departments
  Department.hasMany(Department, {
    foreignKey: 'parentDepartmentId',
    as: 'subDepartments'
  });

  // Has many employees
  Department.hasMany(models.User, {
    foreignKey: 'departmentId',
    as: 'employees'
  });
};

// Instance methods
Department.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

module.exports = Department;


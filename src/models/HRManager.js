const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HRManager = sequelize.define('HRManager', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  hrCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  orgCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canApproveEmployees: true,
      canManageAttendance: true,
      canManageLeaves: true,
      canManagePayroll: true,
      canGenerateReports: true,
      canManageDepartments: true,
      canManageRoles: true
    }
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'Human Resources'
  },
  maxEmployeesAllowed: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  currentEmployeeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = HRManager;
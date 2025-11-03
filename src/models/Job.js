const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  employmentType: {
    type: DataTypes.ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'),
    allowNull: false,
    defaultValue: 'Full-time'
  },
  experienceLevel: {
    type: DataTypes.ENUM('Entry', 'Mid', 'Senior', 'Lead', 'Executive'),
    allowNull: false,
    defaultValue: 'Entry'
  },
  salaryMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salaryMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salaryCurrency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  requirements: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  responsibilities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  benefits: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  companyInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  publicUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'draft', 'paused'),
    defaultValue: 'active'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  applicationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
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
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['deadline']
    }
  ]
});

module.exports = Job;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Form = sequelize.define('Form', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Form title is required' },
      len: {
        args: [2, 200],
        msg: 'Form title must be between 2 and 200 characters'
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  formType: {
    type: DataTypes.ENUM('survey', 'application', 'feedback', 'evaluation', 'custom'),
    defaultValue: 'custom',
    allowNull: false
  },
  fields: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of form field definitions with type, label, validation, etc.'
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Form settings like allowMultipleSubmissions, showProgressBar, etc.'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed', 'archived'),
    defaultValue: 'draft',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Response count cannot be negative' }
    }
  },
  targetDepartmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  targetTeamId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowMultipleResponses: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'forms',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['createdBy'] },
    { fields: ['status'] },
    { fields: ['formType'] },
    { fields: ['isActive'] },
    { fields: ['publishedAt'] },
    { fields: ['targetDepartmentId'] },
    { fields: ['targetTeamId'] }
  ]
});

// Class methods
Form.associate = (models) => {
  // Belongs to Organization
  Form.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Belongs to User (Creator)
  Form.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  // Belongs to Department (optional target)
  Form.belongsTo(models.Department, {
    foreignKey: 'targetDepartmentId',
    as: 'targetDepartment'
  });

  // Belongs to Team (optional target)
  Form.belongsTo(models.Team, {
    foreignKey: 'targetTeamId',
    as: 'targetTeam'
  });

  // Has many responses
  Form.hasMany(models.FormResponse, {
    foreignKey: 'formId',
    as: 'responses'
  });
};

// Instance methods
Form.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

// Static method to validate form fields
Form.validateFields = (fields) => {
  if (!Array.isArray(fields)) {
    throw new Error('Fields must be an array');
  }

  for (const field of fields) {
    if (!field.type || !field.label) {
      throw new Error('Each field must have a type and label');
    }

    const validTypes = [
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      'date', 'time', 'datetime', 'select', 'radio', 'checkbox',
      'file', 'rating', 'signature'
    ];

    if (!validTypes.includes(field.type)) {
      throw new Error(`Invalid field type: ${field.type}`);
    }
  }

  return true;
};

module.exports = Form;


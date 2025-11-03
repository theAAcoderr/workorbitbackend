const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FormResponse = sequelize.define('FormResponse', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  formId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Forms',
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
  respondentId: {
    type: DataTypes.UUID,
    allowNull: true, // Null if anonymous
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  responses: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Object containing field_id: value pairs'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 compatible
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time taken to complete the form in seconds'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score if form is an evaluation/quiz'
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'reviewed', 'approved', 'rejected'),
    defaultValue: 'submitted',
    allowNull: false
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'form_responses',
  timestamps: true,
  indexes: [
    { fields: ['formId'] },
    { fields: ['organizationId'] },
    { fields: ['respondentId'] },
    { fields: ['status'] },
    { fields: ['submittedAt'] },
    { fields: ['reviewedBy'] }
  ]
});

// Class methods
FormResponse.associate = (models) => {
  // Belongs to Form
  FormResponse.belongsTo(models.Form, {
    foreignKey: 'formId',
    as: 'form'
  });

  // Belongs to Organization
  FormResponse.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Belongs to User (Respondent)
  FormResponse.belongsTo(models.User, {
    foreignKey: 'respondentId',
    as: 'respondent'
  });

  // Belongs to User (Reviewer)
  FormResponse.belongsTo(models.User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer'
  });
};

// Instance methods
FormResponse.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Don't expose sensitive info in anonymous responses
  if (!values.respondentId) {
    delete values.ipAddress;
    delete values.userAgent;
  }
  return values;
};

module.exports = FormResponse;


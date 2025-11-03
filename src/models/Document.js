const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Document name is required' },
      len: {
        args: [1, 255],
        msg: 'Document name must be between 1 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Original file name'
  },
  fileUrl: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'File URL is required' }
    }
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'File extension/type (pdf, docx, xlsx, etc.)'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME type of the file'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'File size in bytes'
  },
  category: {
    type: DataTypes.ENUM('Policies', 'Contracts', 'Reports', 'Personal', 'Shared', 'Other'),
    allowNull: false,
    defaultValue: 'Other'
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'organization', 'shared'),
    allowNull: false,
    defaultValue: 'private',
    comment: 'public: everyone, private: only uploader, organization: all in org, shared: specific users'
  },
  sharedWith: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: [],
    comment: 'Array of user IDs who have access (for shared visibility)'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Tags for better organization and search'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Document version number'
  },
  parentDocumentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'documents',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Reference to previous version if this is an updated version'
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    allowNull: false,
    defaultValue: 'active'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Optional expiration date for temporary documents'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata (author, creation date, etc.)'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  indexes: [
    { fields: ['uploadedById'] },
    { fields: ['organizationId'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['visibility'] },
    { fields: ['createdAt'] },
    { fields: ['name'] },
    { fields: ['fileType'] }
  ]
});

module.exports = Document;

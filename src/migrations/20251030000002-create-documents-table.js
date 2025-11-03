'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fileName: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      fileUrl: {
        type: Sequelize.STRING(1000),
        allowNull: false
      },
      fileType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fileSize: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      category: {
        type: Sequelize.ENUM('Policies', 'Contracts', 'Reports', 'Personal', 'Shared', 'Other'),
        allowNull: false,
        defaultValue: 'Other'
      },
      uploadedById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private', 'organization', 'shared'),
        allowNull: false,
        defaultValue: 'private'
      },
      sharedWith: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        defaultValue: []
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      parentDocumentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'documents',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('active', 'archived', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      downloadCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('documents', ['uploadedById']);
    await queryInterface.addIndex('documents', ['organizationId']);
    await queryInterface.addIndex('documents', ['category']);
    await queryInterface.addIndex('documents', ['status']);
    await queryInterface.addIndex('documents', ['visibility']);
    await queryInterface.addIndex('documents', ['createdAt']);
    await queryInterface.addIndex('documents', ['name']);
    await queryInterface.addIndex('documents', ['fileType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AssetRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      requestType: {
        type: Sequelize.ENUM('new_asset', 'return_asset', 'replacement', 'repair'),
        allowNull: false
      },
      assetId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      requestedCategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      requestedById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      approvedById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('AssetRequests', ['organizationId']);
    await queryInterface.addIndex('AssetRequests', ['requestedById']);
    await queryInterface.addIndex('AssetRequests', ['status']);
    await queryInterface.addIndex('AssetRequests', ['requestType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AssetRequests');
  }
};

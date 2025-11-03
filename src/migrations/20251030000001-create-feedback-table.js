'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Feedbacks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('positive', 'constructive', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      submitterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recipientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      visibility: {
        type: Sequelize.ENUM('private', 'team', 'public'),
        allowNull: false,
        defaultValue: 'private'
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'acknowledged', 'archived'),
        allowNull: false,
        defaultValue: 'pending'
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
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

    // Create indexes for better query performance
    await queryInterface.addIndex('Feedbacks', ['submitterId'], {
      name: 'idx_feedbacks_submitter_id'
    });

    await queryInterface.addIndex('Feedbacks', ['recipientId'], {
      name: 'idx_feedbacks_recipient_id'
    });

    await queryInterface.addIndex('Feedbacks', ['organizationId'], {
      name: 'idx_feedbacks_organization_id'
    });

    await queryInterface.addIndex('Feedbacks', ['type'], {
      name: 'idx_feedbacks_type'
    });

    await queryInterface.addIndex('Feedbacks', ['status'], {
      name: 'idx_feedbacks_status'
    });

    await queryInterface.addIndex('Feedbacks', ['createdAt'], {
      name: 'idx_feedbacks_created_at'
    });

    // Composite indexes for common queries
    await queryInterface.addIndex('Feedbacks', ['submitterId', 'createdAt'], {
      name: 'idx_feedbacks_submitter_created'
    });

    await queryInterface.addIndex('Feedbacks', ['recipientId', 'createdAt'], {
      name: 'idx_feedbacks_recipient_created'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indexes first
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_submitter_id');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_recipient_id');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_organization_id');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_type');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_status');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_created_at');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_submitter_created');
    await queryInterface.removeIndex('Feedbacks', 'idx_feedbacks_recipient_created');

    // Drop the table
    await queryInterface.dropTable('Feedbacks');
  }
};

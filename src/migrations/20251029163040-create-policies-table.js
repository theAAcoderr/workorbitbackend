'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create policies table
    await queryInterface.createTable('policies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('HR', 'IT', 'Security', 'Code of Conduct', 'Safety', 'Other'),
        defaultValue: 'Other',
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      version: {
        type: Sequelize.STRING,
        defaultValue: '1.0'
      },
      effectiveDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expiryDate: {
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
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isMandatory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      documentUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Create policy_acknowledgments table
    await queryInterface.createTable('policy_acknowledgments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      policyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'policies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });

    // Add indexes for policies table
    await queryInterface.addIndex('policies', ['organizationId'], {
      name: 'policies_organization_id_idx'
    });
    await queryInterface.addIndex('policies', ['category'], {
      name: 'policies_category_idx'
    });
    await queryInterface.addIndex('policies', ['isActive'], {
      name: 'policies_is_active_idx'
    });
    await queryInterface.addIndex('policies', ['isMandatory'], {
      name: 'policies_is_mandatory_idx'
    });
    await queryInterface.addIndex('policies', ['effectiveDate'], {
      name: 'policies_effective_date_idx'
    });
    await queryInterface.addIndex('policies', ['organizationId', 'isActive'], {
      name: 'policies_org_active_idx'
    });

    // Add indexes for policy_acknowledgments table
    await queryInterface.addIndex('policy_acknowledgments', ['policyId'], {
      name: 'policy_ack_policy_id_idx'
    });
    await queryInterface.addIndex('policy_acknowledgments', ['userId'], {
      name: 'policy_ack_user_id_idx'
    });
    await queryInterface.addIndex('policy_acknowledgments', ['policyId', 'userId'], {
      unique: true,
      name: 'policy_ack_policy_user_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('policy_acknowledgments');
    await queryInterface.dropTable('policies');
  }
};

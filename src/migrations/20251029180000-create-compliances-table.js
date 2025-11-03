'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('compliances', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM(
          'Certification',
          'License',
          'Policy',
          'Training',
          'Audit',
          'Insurance',
          'Other'
        ),
        allowNull: false,
        defaultValue: 'Other',
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Active', 'Expiring Soon', 'Expired', 'Pending', 'Renewed'),
        allowNull: false,
        defaultValue: 'Active',
      },
      issueDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reminderDays: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      issuingAuthority: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      certificateNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('compliances', ['organizationId'], {
      name: 'compliances_organization_id_idx',
    });

    await queryInterface.addIndex('compliances', ['type'], {
      name: 'compliances_type_idx',
    });

    await queryInterface.addIndex('compliances', ['status'], {
      name: 'compliances_status_idx',
    });

    await queryInterface.addIndex('compliances', ['expiryDate'], {
      name: 'compliances_expiry_date_idx',
    });

    await queryInterface.addIndex('compliances', ['assignedTo'], {
      name: 'compliances_assigned_to_idx',
    });

    await queryInterface.addIndex('compliances', ['isActive'], {
      name: 'compliances_is_active_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('compliances');
  },
};

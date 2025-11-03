'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidays', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('public', 'company', 'optional'),
        defaultValue: 'company',
        allowNull: false
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
    await queryInterface.addIndex('holidays', ['organizationId'], {
      name: 'holidays_organization_id_idx'
    });
    await queryInterface.addIndex('holidays', ['date'], {
      name: 'holidays_date_idx'
    });
    await queryInterface.addIndex('holidays', ['type'], {
      name: 'holidays_type_idx'
    });
    await queryInterface.addIndex('holidays', ['isActive'], {
      name: 'holidays_is_active_idx'
    });
    await queryInterface.addIndex('holidays', ['organizationId', 'date'], {
      name: 'holidays_org_date_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('holidays');
  }
};

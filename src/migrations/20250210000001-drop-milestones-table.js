'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🗑️ Dropping Milestones table...');

    await queryInterface.dropTable('Milestones');

    console.log('✅ Milestones table dropped successfully');
  },

  async down(queryInterface, Sequelize) {
    // Recreate table if rollback is needed
    await queryInterface.createTable('Milestones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      targetDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      achievedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deliverables: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
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

    console.log('✅ Milestones table recreated');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('milestones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
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
        allowNull: false
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
        type: Sequelize.ARRAY(Sequelize.STRING),
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
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
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

    await queryInterface.addIndex('milestones', ['projectId']);
    await queryInterface.addIndex('milestones', ['targetDate']);
    await queryInterface.addIndex('milestones', ['isCompleted']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('milestones');
  }
};
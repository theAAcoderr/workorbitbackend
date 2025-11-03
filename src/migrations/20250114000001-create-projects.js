'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('planning', 'active', 'onHold', 'completed', 'cancelled', 'archived'),
        defaultValue: 'planning'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actualEndDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      projectManagerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      teamMemberIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      departmentIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
      },
      spentBudget: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      tagIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      completionPercentage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          allowTaskCreation: true,
          requireApproval: false,
          notifyOnTaskComplete: true,
          notifyOnComment: true,
          autoAssignSubtasks: false,
          permissions: {}
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

    await queryInterface.addIndex('projects', ['organizationId']);
    await queryInterface.addIndex('projects', ['projectManagerId']);
    await queryInterface.addIndex('projects', ['status']);
    await queryInterface.addIndex('projects', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};
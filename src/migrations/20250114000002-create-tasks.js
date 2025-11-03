
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('todo', 'inProgress', 'review', 'testing', 'done', 'cancelled', 'blocked'),
        defaultValue: 'todo'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent', 'critical'),
        defaultValue: 'medium'
      },
      type: {
        type: Sequelize.ENUM('task', 'bug', 'feature', 'improvement', 'epic', 'story', 'subtask'),
        defaultValue: 'task'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      assigneeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      assigneeIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      reporterId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      watcherIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      estimatedHours: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      actualHours: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      dependencyTaskIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      blockingTaskIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      tagIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      labelIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      comments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      checklist: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      parentTaskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        }
      },
      subtaskIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      recurrence: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      customFields: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    await queryInterface.addIndex('tasks', ['projectId']);
    await queryInterface.addIndex('tasks', ['assigneeId']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['priority']);
    await queryInterface.addIndex('tasks', ['dueDate']);
    await queryInterface.addIndex('tasks', ['parentTaskId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  }
};
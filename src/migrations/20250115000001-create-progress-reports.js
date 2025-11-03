'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProgressReports', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
      userName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      organizationId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      projectName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      taskName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reportDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      hoursWorked: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false
      },
      progressPercentage: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      challenges: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      imageUrls: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      documentUrls: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'reviewed', 'approved'),
        allowNull: false,
        defaultValue: 'submitted'
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewComments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('ProgressReports', ['userId']);
    await queryInterface.addIndex('ProgressReports', ['organizationId']);
    await queryInterface.addIndex('ProgressReports', ['projectId']);
    await queryInterface.addIndex('ProgressReports', ['taskId']);
    await queryInterface.addIndex('ProgressReports', ['reportDate']);
    await queryInterface.addIndex('ProgressReports', ['status']);
    await queryInterface.addIndex('ProgressReports', ['submittedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProgressReports');
  }
};
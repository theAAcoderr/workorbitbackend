'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Expenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      employeeId: {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
          'travel',
          'food',
          'accommodation',
          'supplies',
          'equipment',
          'fuel',
          'entertainment',
          'communication',
          'training',
          'medical',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      expenseDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      submittedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
      reviewedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewComments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      receiptNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vendor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'card', 'bank_transfer', 'mobile_payment', 'other'),
        allowNull: true
      },
      reimbursementStatus: {
        type: Sequelize.ENUM('not_reimbursed', 'processing', 'reimbursed'),
        allowNull: false,
        defaultValue: 'not_reimbursed'
      },
      reimbursementDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reimbursementReference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('Expenses', ['employeeId']);
    await queryInterface.addIndex('Expenses', ['organizationId']);
    await queryInterface.addIndex('Expenses', ['status']);
    await queryInterface.addIndex('Expenses', ['expenseDate']);
    await queryInterface.addIndex('Expenses', ['category']);
    await queryInterface.addIndex('Expenses', ['projectId']);
    await queryInterface.addIndex('Expenses', ['departmentId']);
    await queryInterface.addIndex('Expenses', ['reviewedBy']);
    await queryInterface.addIndex('Expenses', ['submittedDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Expenses');
  }
};
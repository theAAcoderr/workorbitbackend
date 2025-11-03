'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PerformanceReviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      reviewerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reviewPeriod: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'e.g., Q1 2025, Jan-Mar 2025, 2025 Annual'
      },
      reviewDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      overallScore: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Overall score from 0.00 to 5.00'
      },
      ratings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Object with categories and scores, e.g., {productivity: 4.5, teamwork: 4.0}'
      },
      strengths: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      areasForImprovement: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      goals: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of goals for next review period'
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'in_progress', 'completed', 'acknowledged'),
        defaultValue: 'draft',
        allowNull: false
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When employee acknowledged the review'
      },
      employeeComments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Employee feedback on the review'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional data like attachments, tags, etc.'
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
    await queryInterface.addIndex('PerformanceReviews', ['employeeId'], {
      name: 'performance_reviews_employee_id_idx'
    });

    await queryInterface.addIndex('PerformanceReviews', ['reviewerId'], {
      name: 'performance_reviews_reviewer_id_idx'
    });

    await queryInterface.addIndex('PerformanceReviews', ['organizationId'], {
      name: 'performance_reviews_organization_id_idx'
    });

    await queryInterface.addIndex('PerformanceReviews', ['status'], {
      name: 'performance_reviews_status_idx'
    });

    await queryInterface.addIndex('PerformanceReviews', ['reviewDate'], {
      name: 'performance_reviews_review_date_idx'
    });

    console.log('✅ PerformanceReviews table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PerformanceReviews');
    console.log('✅ PerformanceReviews table dropped successfully');
  }
};

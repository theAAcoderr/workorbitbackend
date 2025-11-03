'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Jobs table
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      employmentType: {
        type: Sequelize.ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'),
        allowNull: false,
        defaultValue: 'Full-time'
      },
      experienceLevel: {
        type: Sequelize.ENUM('Entry', 'Mid', 'Senior', 'Lead', 'Executive'),
        allowNull: false,
        defaultValue: 'Entry'
      },
      salaryMin: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      salaryMax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      salaryCurrency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      requirements: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      responsibilities: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      benefits: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      companyInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      qrCode: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      publicUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'draft', 'paused'),
        defaultValue: 'active'
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      applicationsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
      organizationId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Create Applications table
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      trackingCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      securityPin: {
        type: Sequelize.STRING,
        allowNull: false
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      jobTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING,
        allowNull: false
      },
      candidateInfo: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      resume: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      coverLetter: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'On Hold'),
        defaultValue: 'Applied'
      },
      statusHistory: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      appliedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      additionalInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      documents: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      scoreMatch: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add indexes
    await queryInterface.addIndex('jobs', ['status']);
    await queryInterface.addIndex('jobs', ['organizationId']);
    await queryInterface.addIndex('jobs', ['createdBy']);
    await queryInterface.addIndex('jobs', ['deadline']);

    await queryInterface.addIndex('applications', ['trackingCode']);
    await queryInterface.addIndex('applications', ['jobId']);
    await queryInterface.addIndex('applications', ['status']);
    await queryInterface.addIndex('applications', ['organizationId']);
    await queryInterface.addIndex('applications', ['appliedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('applications');
    await queryInterface.dropTable('jobs');
  }
};
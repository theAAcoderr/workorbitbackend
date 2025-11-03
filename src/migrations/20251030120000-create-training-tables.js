'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Courses table
    await queryInterface.createTable('Courses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
        type: Sequelize.STRING,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in hours'
      },
      level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner'
      },
      content: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Course modules, lessons, etc.'
      },
      thumbnailUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      videoUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      materialUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      certificateTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      instructorName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      maxEnrollments: {
        type: Sequelize.INTEGER,
        allowNull: true
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

    // Add indexes for Courses table
    await queryInterface.addIndex('Courses', ['organizationId'], {
      name: 'courses_organization_id_index'
    });
    await queryInterface.addIndex('Courses', ['category'], {
      name: 'courses_category_index'
    });
    await queryInterface.addIndex('Courses', ['isActive'], {
      name: 'courses_is_active_index'
    });

    // Create CourseEnrollments table
    await queryInterface.createTable('CourseEnrollments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      status: {
        type: Sequelize.ENUM('enrolled', 'in_progress', 'completed', 'dropped'),
        defaultValue: 'enrolled'
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Progress percentage 0-100'
      },
      enrolledAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      certificateUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '1-5 stars'
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add indexes for CourseEnrollments table
    await queryInterface.addIndex('CourseEnrollments', ['courseId', 'userId'], {
      name: 'course_enrollments_course_user_unique',
      unique: true
    });
    await queryInterface.addIndex('CourseEnrollments', ['userId'], {
      name: 'course_enrollments_user_id_index'
    });
    await queryInterface.addIndex('CourseEnrollments', ['status'], {
      name: 'course_enrollments_status_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop CourseEnrollments table first (due to foreign key)
    await queryInterface.dropTable('CourseEnrollments');

    // Drop Courses table
    await queryInterface.dropTable('Courses');
  }
};
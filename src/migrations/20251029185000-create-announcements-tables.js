'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create announcements table
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachmentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      targetAudience: {
        type: Sequelize.ENUM('all', 'department', 'role', 'specific'),
        defaultValue: 'all',
      },
      targetDepartment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      targetRole: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create announcement_reads table
    await queryInterface.createTable('announcement_reads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      announcementId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'announcements',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      readAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for announcements
    await queryInterface.addIndex('announcements', ['organizationId'], {
      name: 'announcements_organization_id_idx',
    });
    await queryInterface.addIndex('announcements', ['priority'], {
      name: 'announcements_priority_idx',
    });
    await queryInterface.addIndex('announcements', ['targetAudience'], {
      name: 'announcements_target_audience_idx',
    });
    await queryInterface.addIndex('announcements', ['isPinned'], {
      name: 'announcements_is_pinned_idx',
    });
    await queryInterface.addIndex('announcements', ['isActive'], {
      name: 'announcements_is_active_idx',
    });
    await queryInterface.addIndex('announcements', ['createdAt'], {
      name: 'announcements_created_at_idx',
    });

    // Add indexes for announcement_reads
    await queryInterface.addIndex('announcement_reads', ['announcementId'], {
      name: 'announcement_reads_announcement_id_idx',
    });
    await queryInterface.addIndex('announcement_reads', ['userId'], {
      name: 'announcement_reads_user_id_idx',
    });
    await queryInterface.addIndex('announcement_reads', ['announcementId', 'userId'], {
      name: 'announcement_reads_unique_idx',
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('announcement_reads');
    await queryInterface.dropTable('announcements');
  },
};

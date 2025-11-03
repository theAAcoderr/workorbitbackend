'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create HRManagers table
    await queryInterface.createTable('HRManagers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
      orgCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {
          canApproveEmployees: true,
          canManageAttendance: true,
          canManageLeaves: true,
          canManagePayroll: true,
          canGenerateReports: true,
          canManageDepartments: true,
          canManageRoles: true
        }
      },
      department: {
        type: Sequelize.STRING,
        defaultValue: 'Human Resources'
      },
      maxEmployeesAllowed: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      currentEmployeeCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Create JoinRequests table
    await queryInterface.createTable('JoinRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      requestType: {
        type: Sequelize.ENUM('hr_join', 'staff_join'),
        allowNull: false
      },
      requestedRole: {
        type: Sequelize.ENUM('hr', 'manager', 'employee'),
        allowNull: false
      },
      requestedOrgCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      requestedHRCode: {
        type: Sequelize.STRING,
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
        onDelete: 'SET NULL'
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending'
      },
      requestMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responseMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      requestedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Create NotificationPreferences table
    await queryInterface.createTable('NotificationPreferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      emailEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailAttendance: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailLeave: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailTask: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailMeeting: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailPayroll: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushAttendance: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushLeave: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushTask: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushMeeting: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushPayroll: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      pushSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      inAppEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      smsEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      smsAttendance: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      smsLeave: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      smsMeeting: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      dailyDigest: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      weeklyDigest: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      digestTime: {
        type: Sequelize.TIME,
        defaultValue: '09:00:00'
      },
      doNotDisturb: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      dndStartTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      dndEndTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      fcmTokens: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
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

    // Add indexes for HRManagers
    await queryInterface.addIndex('HRManagers', ['hrCode'], {
      name: 'idx_hr_managers_hr_code',
      unique: true
    });

    await queryInterface.addIndex('HRManagers', ['userId'], {
      name: 'idx_hr_managers_user'
    });

    await queryInterface.addIndex('HRManagers', ['organizationId'], {
      name: 'idx_hr_managers_organization'
    });

    await queryInterface.addIndex('HRManagers', ['status'], {
      name: 'idx_hr_managers_status'
    });

    // Add indexes for JoinRequests
    await queryInterface.addIndex('JoinRequests', ['userId'], {
      name: 'idx_join_requests_user'
    });

    await queryInterface.addIndex('JoinRequests', ['organizationId'], {
      name: 'idx_join_requests_organization'
    });

    await queryInterface.addIndex('JoinRequests', ['status'], {
      name: 'idx_join_requests_status'
    });

    await queryInterface.addIndex('JoinRequests', ['requestType'], {
      name: 'idx_join_requests_type'
    });

    await queryInterface.addIndex('JoinRequests', ['requestedOrgCode'], {
      name: 'idx_join_requests_org_code'
    });

    await queryInterface.addIndex('JoinRequests', ['requestedHRCode'], {
      name: 'idx_join_requests_hr_code'
    });

    // Add indexes for NotificationPreferences
    await queryInterface.addIndex('NotificationPreferences', ['userId'], {
      name: 'idx_notification_preferences_user',
      unique: true
    });

    console.log('✅ HR infrastructure tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('NotificationPreferences');
    await queryInterface.dropTable('JoinRequests');
    await queryInterface.dropTable('HRManagers');

    console.log('✅ HR infrastructure tables dropped successfully');
  }
};

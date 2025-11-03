'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Shifts table
    await queryInterface.createTable('Shifts', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      breakMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isNightShift: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#2196F3'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      applicableDays: {
        type: Sequelize.JSON,
        defaultValue: [1, 2, 3, 4, 5]
      },
      overtimeAllowed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      overtimeRate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 1.5
      },
      gracePeriodMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 15
      },
      minimumStaff: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      maximumStaff: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
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
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create ShiftRosters table
    await queryInterface.createTable('ShiftRosters', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      departmentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      publishedBy: {
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
        type: Sequelize.ENUM('draft', 'pending_approval', 'approved', 'published', 'archived'),
        defaultValue: 'draft'
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
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      autoAssignEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      rotationPattern: {
        type: Sequelize.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
        defaultValue: 'weekly'
      },
      notifyOnPublish: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notifyOnChange: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      reminderDays: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
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
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create ShiftAssignments table
    await queryInterface.createTable('ShiftAssignments', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rosterId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'ShiftRosters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      shiftId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Shifts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('assigned', 'confirmed', 'declined', 'swap_requested', 'cancelled'),
        defaultValue: 'assigned'
      },
      confirmedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      declinedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      declineReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      swapRequestedWith: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      swapRequestedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      swapApprovedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      swapApprovedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualStartTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      actualEndTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      actualBreakMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      overtimeMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      checkInLocation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      checkOutLocation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      performance: {
        type: Sequelize.ENUM('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notificationsSent: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
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
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for Shifts
    await queryInterface.addIndex('Shifts', ['organizationId'], {
      name: 'idx_shifts_organization'
    });

    await queryInterface.addIndex('Shifts', ['hrCode'], {
      name: 'idx_shifts_hr_code'
    });

    await queryInterface.addIndex('Shifts', ['isActive'], {
      name: 'idx_shifts_active'
    });

    await queryInterface.addIndex('Shifts', ['organizationId', 'isActive'], {
      name: 'idx_shifts_org_active'
    });

    // Add indexes for ShiftRosters
    await queryInterface.addIndex('ShiftRosters', ['organizationId'], {
      name: 'idx_shift_rosters_organization'
    });

    await queryInterface.addIndex('ShiftRosters', ['hrCode'], {
      name: 'idx_shift_rosters_hr_code'
    });

    await queryInterface.addIndex('ShiftRosters', ['departmentId'], {
      name: 'idx_shift_rosters_department'
    });

    await queryInterface.addIndex('ShiftRosters', ['startDate', 'endDate'], {
      name: 'idx_shift_rosters_date_range'
    });

    await queryInterface.addIndex('ShiftRosters', ['status'], {
      name: 'idx_shift_rosters_status'
    });

    await queryInterface.addIndex('ShiftRosters', ['isPublished'], {
      name: 'idx_shift_rosters_published'
    });

    // Add indexes for ShiftAssignments
    await queryInterface.addIndex('ShiftAssignments', ['organizationId'], {
      name: 'idx_shift_assignments_organization'
    });

    await queryInterface.addIndex('ShiftAssignments', ['hrCode'], {
      name: 'idx_shift_assignments_hr_code'
    });

    await queryInterface.addIndex('ShiftAssignments', ['rosterId'], {
      name: 'idx_shift_assignments_roster'
    });

    await queryInterface.addIndex('ShiftAssignments', ['shiftId'], {
      name: 'idx_shift_assignments_shift'
    });

    await queryInterface.addIndex('ShiftAssignments', ['employeeId'], {
      name: 'idx_shift_assignments_employee'
    });

    await queryInterface.addIndex('ShiftAssignments', ['date'], {
      name: 'idx_shift_assignments_date'
    });

    await queryInterface.addIndex('ShiftAssignments', ['status'], {
      name: 'idx_shift_assignments_status'
    });

    await queryInterface.addIndex('ShiftAssignments', ['employeeId', 'date', 'shiftId'], {
      name: 'idx_shift_assignments_employee_date_shift',
      unique: true
    });

    await queryInterface.addIndex('ShiftAssignments', ['employeeId', 'date'], {
      name: 'idx_shift_assignments_employee_date'
    });

    await queryInterface.addIndex('ShiftAssignments', ['organizationId', 'date'], {
      name: 'idx_shift_assignments_org_date'
    });

    console.log('✅ Shift management tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('ShiftAssignments');
    await queryInterface.dropTable('ShiftRosters');
    await queryInterface.dropTable('Shifts');

    console.log('✅ Shift management tables dropped successfully');
  }
};

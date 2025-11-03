'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Leaves table
    await queryInterface.createTable('Leaves', {
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
      managerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      numberOfDays: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      duration: {
        type: Sequelize.ENUM('fullDay', 'halfDay'),
        defaultValue: 'fullDay'
      },
      halfDayPeriod: {
        type: Sequelize.ENUM('firstHalf', 'secondHalf'),
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      attachmentUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled', 'withdrawn'),
        defaultValue: 'pending'
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
      approverComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvalHistory: {
        type: Sequelize.JSON,
        defaultValue: []
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

    // Create LeaveBalances table
    await queryInterface.createTable('LeaveBalances', {
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
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      leaveType: {
        type: Sequelize.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
        allowNull: false
      },
      totalDays: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      usedDays: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      remainingDays: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      carriedForwardDays: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
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

    // Create LeavePolicies table
    await queryInterface.createTable('LeavePolicies', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      leaveType: {
        type: Sequelize.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'compensatory', 'unpaid', 'other'),
        allowNull: false
      },
      daysPerYear: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      canCarryForward: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      maxCarryForwardDays: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      requiresApproval: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      requiresDocument: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      minDaysNotice: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maxConsecutiveDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      applicableFor: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      description: {
        type: Sequelize.TEXT,
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

    // Add indexes for Leaves
    await queryInterface.addIndex('Leaves', ['employeeId', 'status'], {
      name: 'idx_leaves_employee_status'
    });

    await queryInterface.addIndex('Leaves', ['organizationId', 'status'], {
      name: 'idx_leaves_org_status'
    });

    await queryInterface.addIndex('Leaves', ['managerId', 'status'], {
      name: 'idx_leaves_manager_status'
    });

    await queryInterface.addIndex('Leaves', ['startDate', 'endDate'], {
      name: 'idx_leaves_date_range'
    });

    await queryInterface.addIndex('Leaves', ['createdAt'], {
      name: 'idx_leaves_created_at'
    });

    // Add indexes for LeaveBalances
    await queryInterface.addIndex('LeaveBalances', ['employeeId', 'year', 'leaveType'], {
      name: 'idx_leave_balances_employee_year_type',
      unique: true
    });

    await queryInterface.addIndex('LeaveBalances', ['organizationId', 'year'], {
      name: 'idx_leave_balances_org_year'
    });

    // Add indexes for LeavePolicies
    await queryInterface.addIndex('LeavePolicies', ['organizationId', 'leaveType'], {
      name: 'idx_leave_policies_org_type'
    });

    await queryInterface.addIndex('LeavePolicies', ['isActive'], {
      name: 'idx_leave_policies_active'
    });

    console.log('✅ Leave system tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('LeavePolicies');
    await queryInterface.dropTable('LeaveBalances');
    await queryInterface.dropTable('Leaves');

    console.log('✅ Leave system tables dropped successfully');
  }
};

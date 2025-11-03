'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create exits table
    await queryInterface.createTable('Exits', {
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
      initiatedBy: {
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
      exitType: {
        type: Sequelize.ENUM('resignation', 'termination', 'retirement', 'contract_end', 'other'),
        allowNull: false,
        defaultValue: 'resignation'
      },
      resignationDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      lastWorkingDay: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      noticePeriod: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      exitReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('initiated', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'initiated',
        allowNull: false
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },

      // Exit Interview
      exitInterviewCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      exitInterviewDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      exitInterviewNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      exitInterviewConductedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Asset Return
      assetReturnCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      assetReturnDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      assetReturnNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assetsReturned: {
        type: Sequelize.JSONB,
        defaultValue: []
      },

      // Settlement
      settlementCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      settlementAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      settlementDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      settlementNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Access Revocation
      accessRevoked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      accessRevocationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      accessRevocationNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Documentation
      documentationCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      documentationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      documentationNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },

      // Knowledge Transfer
      knowledgeTransferCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      handoverTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      handoverNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      handoverDate: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Approvals
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

      // Additional Info
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rehireEligible: {
        type: Sequelize.BOOLEAN,
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

    // Add indexes for performance
    await queryInterface.addIndex('Exits', ['employeeId'], {
      name: 'exits_employee_id_idx'
    });

    await queryInterface.addIndex('Exits', ['organizationId'], {
      name: 'exits_organization_id_idx'
    });

    await queryInterface.addIndex('Exits', ['initiatedBy'], {
      name: 'exits_initiated_by_idx'
    });

    await queryInterface.addIndex('Exits', ['lastWorkingDay'], {
      name: 'exits_last_working_day_idx'
    });

    await queryInterface.addIndex('Exits', ['status'], {
      name: 'exits_status_idx'
    });

    await queryInterface.addIndex('Exits', ['organizationId', 'status'], {
      name: 'exits_org_status_idx'
    });

    await queryInterface.addIndex('Exits', ['status', 'progress'], {
      name: 'exits_status_progress_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Exits');
  }
};

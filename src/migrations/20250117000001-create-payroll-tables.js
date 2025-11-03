'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create salary_structures table
    await queryInterface.createTable('salary_structures', {
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
      basicSalary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      effectiveDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      ctc: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Cost to Company (Annual)'
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

    // Create salary_components table
    await queryInterface.createTable('salary_components', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      salaryStructureId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'salary_structures',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      componentType: {
        type: Sequelize.ENUM('allowance', 'deduction'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      calculationType: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Fixed amount if calculationType is fixed'
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Percentage of basic salary if calculationType is percentage'
      },
      isStatutory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a statutory component like PF, ESI'
      },
      isTaxable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Create payrolls table
    await queryInterface.createTable('payrolls', {
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
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12
        }
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 2020,
          max: 2100
        }
      },
      basicSalary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      hra: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'House Rent Allowance'
      },
      da: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Dearness Allowance'
      },
      otherAllowances: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      pf: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Provident Fund'
      },
      esi: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Employee State Insurance'
      },
      professionalTax: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      incomeTax: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      otherDeductions: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      grossSalary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalDeductions: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      netPay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      workingDays: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      presentDays: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      absentDays: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      paidLeaves: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unpaidLeaves: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      overtimeHours: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      overtimeAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'approved', 'paid', 'cancelled', 'on-hold'),
        defaultValue: 'draft'
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.ENUM('bank_transfer', 'cash', 'cheque', 'online'),
        allowNull: true
      },
      bankAccount: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ifscCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
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
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Create payslips table
    await queryInterface.createTable('payslips', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      payrollId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payrolls',
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
      month: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      employeeName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      employeeCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      basicSalary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      grossSalary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      netPay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      deductions: {
        type: Sequelize.JSON,
        defaultValue: {},
        comment: 'JSON object containing all deductions'
      },
      allowances: {
        type: Sequelize.JSON,
        defaultValue: {},
        comment: 'JSON object containing all allowances'
      },
      deductionsTotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      allowancesTotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('generated', 'sent', 'viewed', 'downloaded'),
        defaultValue: 'generated'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sentTo: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Email address where payslip was sent'
      },
      viewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      downloadedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paidOn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      generatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      pdfUrl: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Add indexes for better performance
    await queryInterface.addIndex('salary_structures', ['employeeId', 'isActive']);
    await queryInterface.addIndex('salary_structures', ['organizationId', 'effectiveDate']);

    await queryInterface.addIndex('salary_components', ['salaryStructureId', 'componentType']);

    await queryInterface.addIndex('payrolls', ['employeeId', 'month', 'year', 'organizationId'], {
      unique: true,
      name: 'unique_employee_month_year_org'
    });
    await queryInterface.addIndex('payrolls', ['organizationId', 'status']);
    await queryInterface.addIndex('payrolls', ['month', 'year']);

    await queryInterface.addIndex('payslips', ['payrollId', 'employeeId'], {
      unique: true,
      name: 'unique_payroll_employee'
    });
    await queryInterface.addIndex('payslips', ['employeeId', 'year', 'month']);
    await queryInterface.addIndex('payslips', ['organizationId', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('payslips');
    await queryInterface.dropTable('payrolls');
    await queryInterface.dropTable('salary_components');
    await queryInterface.dropTable('salary_structures');
  }
};
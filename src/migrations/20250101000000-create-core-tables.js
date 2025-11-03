'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Organizations table first (referenced by Users)
    await queryInterface.createTable('Organizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      orgCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      industry: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      phoneNumber: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      logo: {
        type: Sequelize.STRING
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

    // Create Users table (references Organizations)
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'hr', 'manager', 'employee'),
        defaultValue: 'employee'
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'inactive', 'suspended'),
        defaultValue: 'pending'
      },
      employeeId: {
        type: Sequelize.STRING,
        unique: true
      },
      organizationId: {
        type: Sequelize.UUID,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      managerId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      hrCode: {
        type: Sequelize.STRING
      },
      orgCode: {
        type: Sequelize.STRING
      },
      department: {
        type: Sequelize.STRING
      },
      designation: {
        type: Sequelize.STRING
      },
      dateOfJoining: {
        type: Sequelize.DATE
      },
      dateOfBirth: {
        type: Sequelize.DATE
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other')
      },
      address: {
        type: Sequelize.TEXT
      },
      profilePicture: {
        type: Sequelize.STRING
      },
      fcmToken: {
        type: Sequelize.STRING
      },
      refreshToken: {
        type: Sequelize.TEXT
      },
      passwordResetToken: {
        type: Sequelize.STRING
      },
      passwordResetExpires: {
        type: Sequelize.DATE
      },
      lastLogin: {
        type: Sequelize.DATE
      },
      isAssigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create Attendances table (references Users)
    await queryInterface.createTable('Attendances', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      checkInTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      checkOutTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      checkInLocation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      checkOutLocation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      totalDuration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'checked_in', 'checked_out', 'partial'),
        defaultValue: 'absent'
      },
      isGeofenceCompliant: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      geofenceOverrideReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      batteryLevel: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      isConnected: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      deviceInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Add indexes for better performance
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['employeeId']);
    await queryInterface.addIndex('Users', ['organizationId']);
    await queryInterface.addIndex('Organizations', ['orgCode']);
    await queryInterface.addIndex('Attendances', ['userId', 'date'], { unique: true });
    await queryInterface.addIndex('Attendances', ['date']);
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order
    await queryInterface.dropTable('Attendances');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Organizations');
  }
};

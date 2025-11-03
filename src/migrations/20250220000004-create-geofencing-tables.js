'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Geofences table
    await queryInterface.createTable('Geofences', {
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      radius: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 100
      },
      zoneType: {
        type: Sequelize.ENUM('office', 'client', 'home', 'warehouse', 'site'),
        defaultValue: 'office'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      allowCheckIn: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      allowCheckOut: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      workingHours: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Create GeofenceViolations table
    await queryInterface.createTable('GeofenceViolations', {
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
      attendanceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Attendances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      geofenceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Geofences',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      violationType: {
        type: Sequelize.ENUM('check_in_outside', 'check_out_outside', 'unauthorized_location'),
        allowNull: false
      },
      violationTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      location: {
        type: Sequelize.JSON,
        allowNull: false
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      overrideReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isOverridden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      overriddenBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      overriddenAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'resolved'),
        defaultValue: 'pending'
      },
      resolvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolutionNotes: {
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

    // Add indexes for Geofences
    await queryInterface.addIndex('Geofences', ['organizationId'], {
      name: 'idx_geofences_organization'
    });

    await queryInterface.addIndex('Geofences', ['zoneType'], {
      name: 'idx_geofences_zone_type'
    });

    await queryInterface.addIndex('Geofences', ['isActive'], {
      name: 'idx_geofences_active'
    });

    // Add indexes for GeofenceViolations
    await queryInterface.addIndex('GeofenceViolations', ['userId', 'createdAt'], {
      name: 'idx_geofence_violations_user_created'
    });

    await queryInterface.addIndex('GeofenceViolations', ['organizationId'], {
      name: 'idx_geofence_violations_organization'
    });

    await queryInterface.addIndex('GeofenceViolations', ['status'], {
      name: 'idx_geofence_violations_status'
    });

    await queryInterface.addIndex('GeofenceViolations', ['violationType'], {
      name: 'idx_geofence_violations_type'
    });

    console.log('✅ Geofencing tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('GeofenceViolations');
    await queryInterface.dropTable('Geofences');

    console.log('✅ Geofencing tables dropped successfully');
  }
};

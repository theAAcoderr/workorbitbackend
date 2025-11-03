'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationTrackings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      accuracy: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      altitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      speed: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      heading: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activityType: {
        type: Sequelize.ENUM('stationary', 'walking', 'running', 'driving', 'unknown', 'location_update'),
        defaultValue: 'unknown'
      },
      batteryLevel: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      isBackground: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isWithinGeofence: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      currentZone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      distanceFromOffice: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    // Create indexes for better query performance
    await queryInterface.addIndex('LocationTrackings', ['userId', 'timestamp'], {
      name: 'idx_location_user_timestamp'
    });
    
    await queryInterface.addIndex('LocationTrackings', ['attendanceId'], {
      name: 'idx_location_attendance'
    });
    
    await queryInterface.addIndex('LocationTrackings', ['timestamp'], {
      name: 'idx_location_timestamp'
    });
    
    await queryInterface.addIndex('LocationTrackings', ['userId', 'createdAt'], {
      name: 'idx_location_user_created'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('LocationTrackings', 'idx_location_user_timestamp');
    await queryInterface.removeIndex('LocationTrackings', 'idx_location_attendance');
    await queryInterface.removeIndex('LocationTrackings', 'idx_location_timestamp');
    await queryInterface.removeIndex('LocationTrackings', 'idx_location_user_created');
    
    // Drop table
    await queryInterface.dropTable('LocationTrackings');
  }
};
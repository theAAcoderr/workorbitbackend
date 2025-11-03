'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'userId'
      },
      // Appearance settings
      theme: {
        type: Sequelize.ENUM('light', 'dark', 'auto'),
        defaultValue: 'light',
        allowNull: false
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: 'en',
        allowNull: false
      },
      fontSize: {
        type: Sequelize.ENUM('small', 'medium', 'large'),
        defaultValue: 'medium',
        allowNull: false
      },
      // Notification preferences
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'emailNotifications'
      },
      pushNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'pushNotifications'
      },
      smsNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'smsNotifications'
      },
      notifyOnLeaveApproval: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'notifyOnLeaveApproval'
      },
      notifyOnTaskAssignment: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'notifyOnTaskAssignment'
      },
      notifyOnMeetingInvite: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'notifyOnMeetingInvite'
      },
      notifyOnPayslipGeneration: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'notifyOnPayslipGeneration'
      },
      // Privacy settings
      profileVisibility: {
        type: Sequelize.ENUM('public', 'organization', 'private'),
        defaultValue: 'organization',
        allowNull: false,
        field: 'profileVisibility'
      },
      showEmailPublicly: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'showEmailPublicly'
      },
      showPhonePublicly: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'showPhonePublicly'
      },
      allowLocationTracking: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'allowLocationTracking'
      },
      // App behavior settings
      defaultDashboard: {
        type: Sequelize.STRING(50),
        defaultValue: 'home',
        allowNull: true,
        field: 'defaultDashboard'
      },
      autoCheckIn: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'autoCheckIn'
      },
      autoCheckOut: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'autoCheckOut'
      },
      soundEffects: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'soundEffects'
      },
      vibration: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      // Data sync settings
      syncFrequency: {
        type: Sequelize.ENUM('realtime', 'every5min', 'every15min', 'hourly', 'manual'),
        defaultValue: 'every5min',
        allowNull: false,
        field: 'syncFrequency'
      },
      wifiOnlySync: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'wifiOnlySync'
      },
      // Advanced settings
      developerMode: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'developerMode'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updatedAt'
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_settings', ['userId'], {
      unique: true,
      name: 'user_settings_userId_unique'
    });
    await queryInterface.addIndex('user_settings', ['theme']);
    await queryInterface.addIndex('user_settings', ['language']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_settings');
  }
};

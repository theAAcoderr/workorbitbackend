const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * UserSetting Model
 * Stores user-specific application settings and preferences
 */
const UserSetting = sequelize.define('UserSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Appearance settings
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    defaultValue: 'light',
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    allowNull: false
  },
  fontSize: {
    type: DataTypes.ENUM('small', 'medium', 'large'),
    defaultValue: 'medium',
    allowNull: false
  },
  // Notification preferences
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  smsNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notifyOnLeaveApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifyOnTaskAssignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifyOnMeetingInvite: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifyOnPayslipGeneration: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Privacy settings
  profileVisibility: {
    type: DataTypes.ENUM('public', 'organization', 'private'),
    defaultValue: 'organization',
    allowNull: false
  },
  showEmailPublicly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  showPhonePublicly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowLocationTracking: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // App behavior settings
  defaultDashboard: {
    type: DataTypes.STRING(50),
    defaultValue: 'home',
    allowNull: true
  },
  autoCheckIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  autoCheckOut: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  soundEffects: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  vibration: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Data sync settings
  syncFrequency: {
    type: DataTypes.ENUM('realtime', 'every5min', 'every15min', 'hourly', 'manual'),
    defaultValue: 'every5min',
    allowNull: false
  },
  wifiOnlySync: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Advanced settings
  developerMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional custom settings'
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['theme'] },
    { fields: ['language'] }
  ]
});

// Associations
UserSetting.associate = (models) => {
  // Belongs to User
  UserSetting.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Instance methods
UserSetting.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

// Static method to get default settings
UserSetting.getDefaultSettings = () => {
  return {
    theme: 'light',
    language: 'en',
    fontSize: 'medium',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notifyOnLeaveApproval: true,
    notifyOnTaskAssignment: true,
    notifyOnMeetingInvite: true,
    notifyOnPayslipGeneration: true,
    profileVisibility: 'organization',
    showEmailPublicly: false,
    showPhonePublicly: false,
    allowLocationTracking: true,
    defaultDashboard: 'home',
    autoCheckIn: false,
    autoCheckOut: false,
    soundEffects: true,
    vibration: true,
    syncFrequency: 'every5min',
    wifiOnlySync: false,
    developerMode: false,
    metadata: {}
  };
};

module.exports = UserSetting;


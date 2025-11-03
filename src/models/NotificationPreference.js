const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Email notifications
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailLeave: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailTask: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailMeeting: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailPayroll: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // Push notifications
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushLeave: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushTask: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushMeeting: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushPayroll: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pushSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // In-app notifications
  inAppEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // SMS notifications
  smsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  smsAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  smsLeave: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  smsMeeting: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // Digest settings
  dailyDigest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  weeklyDigest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  digestTime: {
    type: DataTypes.TIME,
    defaultValue: '09:00:00'
  },

  // Do not disturb
  doNotDisturb: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dndStartTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  dndEndTime: {
    type: DataTypes.TIME,
    allowNull: true
  },

  // Device tokens for push notifications
  fcmTokens: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },

  // Additional settings
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId']
    }
  ]
});

module.exports = NotificationPreference;

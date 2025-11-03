const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MeetingAttendee = sequelize.define('MeetingAttendee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  meetingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Meetings',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userHrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'accepted',
      'declined',
      'tentative',
      'attended',
      'absent'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  isOrganizer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  hasJoined: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificationsSent: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['meetingId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['meetingId', 'userId']
    }
  ]
});

// Define associations
MeetingAttendee.associate = (models) => {
  // MeetingAttendee belongs to Meeting
  MeetingAttendee.belongsTo(models.Meeting, {
    foreignKey: 'meetingId',
    as: 'meeting'
  });

  // MeetingAttendee belongs to User
  MeetingAttendee.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = MeetingAttendee;
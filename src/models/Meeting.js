const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'teamMeeting',
      'oneOnOne',
      'allHands',
      'clientMeeting',
      'training',
      'interview',
      'boardMeeting',
      'other'
    ),
    allowNull: false,
    defaultValue: 'teamMeeting'
  },
  status: {
    type: DataTypes.ENUM(
      'scheduled',
      'inProgress',
      'completed',
      'cancelled',
      'postponed'
    ),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterStart(value) {
        if (this.startTime && value <= this.startTime) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingLink: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  hrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdByName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdByHrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  agendaItems: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: true
  },
  parentMeetingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Meetings',
      key: 'id'
    }
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowGuestJoin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.STRING,
    allowNull: true
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
      fields: ['organizationId']
    },
    {
      fields: ['hrCode']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['startTime']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

// Define associations - will be set up in index.js
Meeting.associate = (models) => {
  // Meeting belongs to creator
  Meeting.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  // Meeting has many attendees
  Meeting.hasMany(models.MeetingAttendee, {
    foreignKey: 'meetingId',
    as: 'attendees'
  });

  // Meeting has many action items
  Meeting.hasMany(models.MeetingAction, {
    foreignKey: 'meetingId',
    as: 'actionItems'
  });

  // Self-referencing association for recurring meetings
  Meeting.hasMany(models.Meeting, {
    foreignKey: 'parentMeetingId',
    as: 'childMeetings'
  });

  Meeting.belongsTo(models.Meeting, {
    foreignKey: 'parentMeetingId',
    as: 'parentMeeting'
  });
};

// Virtual getters
Meeting.prototype.getDuration = function() {
  return this.endTime - this.startTime;
};

Meeting.prototype.isUpcoming = function() {
  return this.startTime > new Date();
};

Meeting.prototype.isToday = function() {
  const today = new Date();
  const meetingDate = new Date(this.startTime);
  return today.toDateString() === meetingDate.toDateString();
};

Meeting.prototype.getMeetingTypeString = function() {
  const typeMap = {
    'teamMeeting': 'Team Meeting',
    'oneOnOne': '1:1 Meeting',
    'allHands': 'All Hands',
    'clientMeeting': 'Client Meeting',
    'training': 'Training',
    'interview': 'Interview',
    'boardMeeting': 'Board Meeting',
    'other': 'Other'
  };
  return typeMap[this.type] || 'Meeting';
};

module.exports = Meeting;
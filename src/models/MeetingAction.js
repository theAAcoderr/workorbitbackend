const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MeetingAction = sequelize.define('MeetingAction', {
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
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assignedToName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
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
      fields: ['meetingId']
    },
    {
      fields: ['assignedTo']
    },
    {
      fields: ['status']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['isCompleted']
    }
  ],
  hooks: {
    beforeUpdate: (action, options) => {
      if (action.changed('isCompleted') && action.isCompleted) {
        action.completedAt = new Date();
        action.status = 'completed';
      }
    }
  }
});

// Define associations
MeetingAction.associate = (models) => {
  // MeetingAction belongs to Meeting
  MeetingAction.belongsTo(models.Meeting, {
    foreignKey: 'meetingId',
    as: 'meeting'
  });

  // MeetingAction belongs to User (assigned to)
  MeetingAction.belongsTo(models.User, {
    foreignKey: 'assignedTo',
    as: 'assignee'
  });

  // MeetingAction belongs to User (completed by)
  MeetingAction.belongsTo(models.User, {
    foreignKey: 'completedBy',
    as: 'completor'
  });
};

module.exports = MeetingAction;
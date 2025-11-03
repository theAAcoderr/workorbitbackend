const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('todo', 'inProgress', 'review', 'testing', 'done', 'cancelled', 'blocked'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent', 'critical'),
    defaultValue: 'medium'
  },
  type: {
    type: DataTypes.ENUM('task', 'bug', 'feature', 'improvement', 'epic', 'story', 'subtask'),
    defaultValue: 'task'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assigneeIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  watcherIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  estimatedHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  actualHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  dependencyTaskIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  blockingTaskIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  tagIds: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  labelIds: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  comments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  parentTaskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  subtaskIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  recurrence: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'tasks',
  timestamps: true
});

module.exports = Task;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Onboarding = sequelize.define('Onboarding', {
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
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'OnboardingTasks',
      key: 'id'
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of objects: [{fileName: string, fileUrl: string, uploadedAt: date}]'
  },
  skipped: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  skipReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Onboardings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'taskId']
    },
    {
      fields: ['organizationId', 'completed']
    },
    {
      fields: ['userId', 'completed']
    },
    {
      fields: ['dueDate']
    }
  ],
  hooks: {
    beforeSave: async (onboarding) => {
      // Set completedAt when task is marked as completed
      if (onboarding.changed('completed')) {
        if (onboarding.completed && !onboarding.completedAt) {
          onboarding.completedAt = new Date();
        } else if (!onboarding.completed) {
          onboarding.completedAt = null;
        }
      }
    }
  }
});

// Instance methods
Onboarding.prototype.markCompleted = async function(notes = null) {
  this.completed = true;
  this.completedAt = new Date();
  if (notes) this.notes = notes;
  return await this.save();
};

Onboarding.prototype.markIncomplete = async function() {
  this.completed = false;
  this.completedAt = null;
  return await this.save();
};

Onboarding.prototype.skip = async function(reason) {
  this.skipped = true;
  this.skipReason = reason;
  this.completed = true;
  this.completedAt = new Date();
  return await this.save();
};

// Static methods
Onboarding.getProgress = async function(userId) {
  const total = await this.count({ where: { userId } });
  const completed = await this.count({ where: { userId, completed: true } });
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

module.exports = Onboarding;

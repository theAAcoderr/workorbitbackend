const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title is required'
      },
      len: {
        args: [3, 255],
        msg: 'Title must be between 3 and 255 characters'
      }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Message is required'
      },
      len: {
        args: [10, 5000],
        msg: 'Message must be between 10 and 5000 characters'
      }
    }
  },
  type: {
    type: DataTypes.ENUM('positive', 'constructive', 'general'),
    allowNull: false,
    defaultValue: 'general',
    validate: {
      isIn: {
        args: [['positive', 'constructive', 'general']],
        msg: 'Type must be one of: positive, constructive, general'
      }
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Rating must not exceed 5'
      }
    }
  },
  submitterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
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
  visibility: {
    type: DataTypes.ENUM('private', 'team', 'public'),
    allowNull: false,
    defaultValue: 'private',
    validate: {
      isIn: {
        args: [['private', 'team', 'public']],
        msg: 'Visibility must be one of: private, team, public'
      }
    }
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'acknowledged', 'archived'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'acknowledged', 'archived']],
        msg: 'Status must be one of: pending, acknowledged, archived'
      }
    }
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  archivedAt: {
    type: DataTypes.DATE,
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
      fields: ['submitterId']
    },
    {
      fields: ['recipientId']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['submitterId', 'createdAt']
    },
    {
      fields: ['recipientId', 'createdAt']
    }
  ]
});

// Instance methods
Feedback.prototype.acknowledge = async function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  await this.save();
  return this;
};

Feedback.prototype.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  await this.save();
  return this;
};

Feedback.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());

  // Hide submitter details if feedback is anonymous
  if (values.isAnonymous && values.submitter) {
    values.submitterName = 'Anonymous';
    delete values.submitter;
  } else if (values.submitter) {
    values.submitterName = values.submitter.name;
  }

  // Add recipient name
  if (values.recipient) {
    values.recipientName = values.recipient.name;
  }

  return values;
};

module.exports = Feedback;

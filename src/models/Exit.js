const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Exit = sequelize.define('Exit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Employee who is leaving'
  },
  initiatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'HR/Admin who initiated the exit process'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  exitType: {
    type: DataTypes.ENUM('resignation', 'termination', 'retirement', 'contract_end', 'other'),
    allowNull: false,
    defaultValue: 'resignation'
  },
  resignationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when resignation was submitted'
  },
  lastWorkingDay: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Last day of work'
  },
  noticePeriod: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Notice period in days'
  },
  exitReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for leaving'
  },
  status: {
    type: DataTypes.ENUM('initiated', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'initiated',
    allowNull: false
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Overall progress percentage (0-100)'
  },

  // Checklist Items
  exitInterviewCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  exitInterviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  exitInterviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exitInterviewConductedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  assetReturnCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  assetReturnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assetReturnNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assetsReturned: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of returned asset IDs and details'
  },

  settlementCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settlementAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Final settlement amount'
  },
  settlementDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settlementNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  accessRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accessRevocationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accessRevocationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  documentationCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  documentationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  documentationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of document URLs and metadata'
  },

  // Knowledge Transfer
  knowledgeTransferCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  handoverTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User to whom responsibilities are handed over'
  },
  handoverNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  handoverDate: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Final Approvals
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Additional Info
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'General remarks or notes'
  },
  rehireEligible: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Is the employee eligible for rehire'
  }
}, {
  tableName: 'Exits',
  timestamps: true,
  indexes: [
    {
      fields: ['employeeId']
    },
    {
      fields: ['organizationId', 'status']
    },
    {
      fields: ['initiatedBy']
    },
    {
      fields: ['lastWorkingDay']
    },
    {
      fields: ['status', 'progress']
    }
  ],
  hooks: {
    beforeSave: async (exit) => {
      // Auto-calculate progress based on checklist completion
      if (exit.changed('exitInterviewCompleted') ||
          exit.changed('assetReturnCompleted') ||
          exit.changed('settlementCompleted') ||
          exit.changed('accessRevoked') ||
          exit.changed('documentationCompleted')) {
        exit.progress = exit.calculateProgress();
      }

      // Auto-update status to in_progress when any checklist item is completed
      if (exit.status === 'initiated' && exit.progress > 0) {
        exit.status = 'in_progress';
      }

      // Auto-update status to completed when all items are done
      if (exit.progress === 100 && exit.status === 'in_progress') {
        exit.status = 'completed';
        exit.approvedAt = new Date();
      }
    }
  }
});

// Instance methods
Exit.prototype.calculateProgress = function() {
  const checklistItems = [
    this.exitInterviewCompleted,
    this.assetReturnCompleted,
    this.settlementCompleted,
    this.accessRevoked,
    this.documentationCompleted
  ];

  const completed = checklistItems.filter(item => item === true).length;
  const total = checklistItems.length;

  return Math.round((completed / total) * 100);
};

Exit.prototype.updateChecklistItem = async function(itemName, completed, additionalData = {}) {
  const validItems = [
    'exitInterview',
    'assetReturn',
    'settlement',
    'accessRevocation',
    'documentation'
  ];

  if (!validItems.includes(itemName)) {
    throw new Error(`Invalid checklist item: ${itemName}`);
  }

  // Map item names to their actual field names
  const fieldMapping = {
    'exitInterview': 'exitInterviewCompleted',
    'assetReturn': 'assetReturnCompleted',
    'settlement': 'settlementCompleted',
    'accessRevocation': 'accessRevoked',  // Special case: field is "accessRevoked" not "accessRevocationCompleted"
    'documentation': 'documentationCompleted'
  };

  // Update the completed status using the correct field name
  this[fieldMapping[itemName]] = completed;

  // Update date if completed
  if (completed && !this[`${itemName}Date`]) {
    this[`${itemName}Date`] = new Date();
  }

  // Update additional data if provided
  Object.keys(additionalData).forEach(key => {
    const fullKey = itemName + key.charAt(0).toUpperCase() + key.slice(1);
    if (this[fullKey] !== undefined) {
      this[fullKey] = additionalData[key];
    }
  });

  return await this.save();
};

Exit.prototype.markCompleted = async function(approvedBy) {
  this.status = 'completed';
  this.progress = 100;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return await this.save();
};

Exit.prototype.cancel = async function(reason) {
  this.status = 'cancelled';
  this.remarks = `Cancelled: ${reason}`;
  return await this.save();
};

// Static methods
Exit.getByStatus = async function(organizationId, status) {
  return await this.findAll({
    where: { organizationId, status },
    include: [
      {
        association: 'employee',
        attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId']
      },
      {
        association: 'initiator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

Exit.getActiveExits = async function(organizationId) {
  return await this.findAll({
    where: {
      organizationId,
      status: ['initiated', 'in_progress']
    },
    include: [
      {
        association: 'employee',
        attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId', 'department']
      },
      {
        association: 'initiator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['lastWorkingDay', 'ASC']]
  });
};

Exit.getUpcomingExits = async function(organizationId, daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return await this.findAll({
    where: {
      organizationId,
      lastWorkingDay: {
        [require('sequelize').Op.between]: [today, futureDate]
      },
      status: ['initiated', 'in_progress']
    },
    include: [
      {
        association: 'employee',
        attributes: ['id', 'name', 'email', 'department']
      }
    ],
    order: [['lastWorkingDay', 'ASC']]
  });
};

module.exports = Exit;

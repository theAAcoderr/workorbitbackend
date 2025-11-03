const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Team name is required' },
      len: {
        args: [2, 100],
        msg: 'Team name must be between 2 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  teamLeadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  teamType: {
    type: DataTypes.ENUM('project', 'functional', 'cross-functional', 'temporary', 'permanent'),
    defaultValue: 'functional',
    allowNull: false
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: { args: [1], msg: 'Max members must be at least 1' }
    }
  },
  currentMemberCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Member count cannot be negative' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'teams',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['departmentId'] },
    { fields: ['teamLeadId'] },
    { fields: ['teamType'] },
    { fields: ['isActive'] }
  ]
});

// Team Members junction table
const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'team_members',
  timestamps: true,
  indexes: [
    { fields: ['teamId'] },
    { fields: ['userId'] },
    { fields: ['isActive'] },
    { fields: ['teamId', 'userId'], unique: true }
  ]
});

// Class methods
Team.associate = (models) => {
  // Belongs to Organization
  Team.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Belongs to Department
  Team.belongsTo(models.Department, {
    foreignKey: 'departmentId',
    as: 'department'
  });

  // Belongs to User (Team Lead)
  Team.belongsTo(models.User, {
    foreignKey: 'teamLeadId',
    as: 'teamLead'
  });

  // Has many team members through TeamMember junction
  Team.belongsToMany(models.User, {
    through: TeamMember,
    foreignKey: 'teamId',
    otherKey: 'userId',
    as: 'members'
  });
};

TeamMember.associate = (models) => {
  TeamMember.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team'
  });

  TeamMember.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Instance methods
Team.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

module.exports = { Team, TeamMember };


const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isStrongPassword(value) {
        // Minimum 8 characters, at least one uppercase, one lowercase, one number and one special character
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(value)) {
          throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
        }
      }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'hr', 'manager', 'employee', 'temp_setup'),
    defaultValue: 'employee'
  },
  status: {
    type: DataTypes.ENUM('active', 'approved', 'pending_hr_approval', 'pending_staff_approval', 'inactive', 'suspended'),
    defaultValue: 'pending_hr_approval'
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  dateOfJoining: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.JSON,
    allowNull: true
  },
  bankDetails: {
    type: DataTypes.JSON,
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  hrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orgCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  requestedRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestedOrgCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestedHRCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAssigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

User.prototype.incrementLoginAttempts = async function() {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  // Check if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.loginAttempts += 1;

    // Lock account if max attempts reached
    if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      this.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
  }

  await this.save();
};

User.prototype.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.refreshToken;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  delete values.loginAttempts;
  delete values.lockUntil;

  // Add organizationName from the associated organization
  if (values.organization && values.organization.name) {
    values.organizationName = values.organization.name;
  }

  return values;
};

module.exports = User;
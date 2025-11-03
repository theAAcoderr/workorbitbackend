const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assetCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'laptop',
      'desktop',
      'monitor',
      'keyboard',
      'mouse',
      'phone',
      'tablet',
      'printer',
      'scanner',
      'network_device',
      'server',
      'accessory',
      'furniture',
      'vehicle',
      'other'
    ),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Specific type within category (e.g., MacBook Pro, Dell XPS)'
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  warrantyExpiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'available',
      'assigned',
      'in_use',
      'maintenance',
      'repair',
      'retired',
      'lost',
      'damaged'
    ),
    defaultValue: 'available',
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
    defaultValue: 'good',
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Physical location of the asset'
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Employee to whom this asset is assigned'
  },
  assignedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignedById: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Admin/HR who assigned the asset'
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Technical specifications (RAM, Storage, etc.)'
  },
  maintenanceHistory: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of maintenance records'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of image URLs'
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'QR code for asset tracking'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['assignedToId'] },
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['assetCode'] },
    { fields: ['serialNumber'] }
  ]
});

// Instance methods
Asset.prototype.assign = async function(userId, assignedBy) {
  this.assignedToId = userId;
  this.assignedById = assignedBy;
  this.assignedDate = new Date();
  this.status = 'assigned';
  await this.save();
  return this;
};

Asset.prototype.unassign = async function() {
  this.assignedToId = null;
  this.assignedById = null;
  this.assignedDate = null;
  this.returnDate = new Date();
  this.status = 'available';
  await this.save();
  return this;
};

Asset.prototype.addMaintenanceRecord = async function(record) {
  const history = this.maintenanceHistory || [];
  history.push({
    ...record,
    timestamp: new Date()
  });
  this.maintenanceHistory = history;
  await this.save();
  return this;
};

module.exports = Asset;

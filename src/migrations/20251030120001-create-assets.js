'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Assets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      assetCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING,
        allowNull: true
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      serialNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      purchaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      purchasePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      warrantyExpiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
        defaultValue: 'good',
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      assignedToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      assignedById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      returnDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: true
        // Department reference will be added via foreign key if Departments table exists
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      specifications: {
        type: Sequelize.JSON,
        allowNull: true
      },
      maintenanceHistory: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      qrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Assets', ['organizationId']);
    await queryInterface.addIndex('Assets', ['assignedToId']);
    await queryInterface.addIndex('Assets', ['status']);
    await queryInterface.addIndex('Assets', ['category']);
    await queryInterface.addIndex('Assets', ['assetCode']);
    await queryInterface.addIndex('Assets', ['serialNumber']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Assets');
  }
};

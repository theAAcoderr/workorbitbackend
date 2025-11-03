const { Asset, AssetRequest, User, Organization } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const oneSignalService = require('../services/oneSignalService');

// Generate unique asset code
const generateAssetCode = async (organizationId, category, transaction = null) => {
  const prefix = category.substring(0, 3).toUpperCase();

  // IMPORTANT: The assetCode field has a GLOBAL unique constraint (not per-organization)
  // So we must find the highest code across ALL organizations, not just this one
  const lastAsset = await Asset.findOne({
    where: {
      assetCode: {
        [Op.like]: `${prefix}-%`
      }
    },
    order: [['assetCode', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  let nextNumber = 1;
  if (lastAsset && lastAsset.assetCode) {
    // Extract number from last asset code (e.g., "LAP-00005" -> 5)
    const lastNumber = parseInt(lastAsset.assetCode.split('-')[1], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  const generatedCode = `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  console.log(`Generating asset code for ${category}: Found last asset: ${lastAsset?.assetCode || 'none'} (org: ${lastAsset?.organizationId || 'N/A'}), Generated: ${generatedCode}`);

  return generatedCode;
};

// @desc    Get all assets
// @route   GET /api/v1/assets
// @access  Private
exports.getAssets = async (req, res) => {
  try {
    const {
      status,
      category,
      assignedToId,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      organizationId: req.user.organizationId,
      isActive: true
    };

    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see their assigned assets
      where.assignedToId = req.user.id;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (assignedToId && ['admin', 'hr', 'manager'].includes(req.user.role)) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { assetCode: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: assets,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
};

// @desc    Get single asset
// @route   GET /api/v1/assets/:id
// @access  Private
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'employeeId', 'phone']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check permission
    if (req.user.role === 'employee' && asset.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this asset'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
};

// @desc    Create new asset
// @route   POST /api/v1/assets
// @access  Private (Admin, HR)
exports.createAsset = async (req, res) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    const transaction = await sequelize.transaction();

    try {
      const {
        name,
        description,
        category,
        type,
        brand,
        model,
        serialNumber,
        purchaseDate,
        purchasePrice,
        warrantyExpiryDate,
        condition,
        location,
        departmentId,
        specifications,
        notes,
        images
      } = req.body;

      // Generate asset code within transaction to prevent race conditions
      const assetCode = await generateAssetCode(req.user.organizationId, category, transaction);

      // Double-check if asset code already exists (safety check)
      const existingAsset = await Asset.findOne({
        where: {
          organizationId: req.user.organizationId,
          assetCode
        },
        transaction
      });

      if (existingAsset) {
        await transaction.rollback();
        console.warn(`Asset code ${assetCode} already exists, retrying... (attempt ${attempt + 1}/${maxRetries})`);
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }

      // Create asset within transaction
      const asset = await Asset.create({
        assetCode,
        name,
        description,
        category,
        type,
        brand,
        model,
        serialNumber,
        purchaseDate,
        purchasePrice,
        warrantyExpiryDate,
        condition: condition || 'good',
        location,
        departmentId,
        specifications,
        notes,
        images: images || [],
        organizationId: req.user.organizationId,
        createdById: req.user.id,
        status: 'available'
      }, { transaction });

      // Fetch created asset with relations
      const createdAsset = await Asset.findByPk(asset.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ],
        transaction
      });

      // Commit transaction
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: createdAsset
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();

      lastError = error;

      // If it's a unique constraint error, retry
      if (error.name === 'SequelizeUniqueConstraintError' && attempt < maxRetries - 1) {
        console.warn(`Duplicate asset code detected, retrying... (attempt ${attempt + 1}/${maxRetries})`);
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }

      // If we've exhausted retries or it's a different error, break
      break;
    }
  }

  // If we got here, all retries failed
  console.error('Create asset error after retries:', lastError);
  res.status(500).json({
    success: false,
    message: 'Failed to create asset after multiple attempts',
    error: lastError?.message || 'Unknown error'
  });
};

// @desc    Update asset
// @route   PUT /api/v1/assets/:id
// @access  Private (Admin, HR)
exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const {
      name,
      description,
      type,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyExpiryDate,
      status,
      condition,
      location,
      departmentId,
      specifications,
      notes,
      images
    } = req.body;

    await asset.update({
      name: name || asset.name,
      description,
      type,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyExpiryDate,
      status,
      condition,
      location,
      departmentId,
      specifications,
      notes,
      images
    });

    const updatedAsset = await Asset.findByPk(asset.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
};

// @desc    Delete asset
// @route   DELETE /api/v1/assets/:id
// @access  Private (Admin only)
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Soft delete
    await asset.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
};

// @desc    Assign asset to employee
// @route   POST /api/v1/assets/:id/assign
// @access  Private (Admin, HR)
exports.assignAsset = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Asset is currently ${asset.status} and cannot be assigned`
      });
    }

    // Verify employee exists and belongs to same organization
    const employee = await User.findOne({
      where: {
        id: employeeId,
        organizationId: req.user.organizationId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await asset.assign(employeeId, req.user.id);

    const updatedAsset = await Asset.findByPk(asset.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Send notification to employee about asset assignment
    try {
      await oneSignalService.sendToUser(
        employeeId.toString(),
        {
          title: '💼 Asset Assigned to You',
          message: `${asset.name} (${asset.assetCode}) has been assigned to you by ${req.user.name}`,
          data: {
            type: 'asset_assigned',
            assetId: asset.id,
            assetCode: asset.assetCode,
            assetName: asset.name,
            category: asset.category,
            assignedBy: req.user.name,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log(`✅ Asset assignment notification sent to employee ${employeeId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send asset assignment notification:', notificationError);
      // Don't fail the asset assignment if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Asset assigned successfully',
      data: updatedAsset
    });
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign asset',
      error: error.message
    });
  }
};

// @desc    Unassign/Return asset
// @route   POST /api/v1/assets/:id/unassign
// @access  Private (Admin, HR)
exports.unassignAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not assigned to anyone'
      });
    }

    await asset.unassign();

    const updatedAsset = await Asset.findByPk(asset.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'employeeId']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Asset returned successfully',
      data: updatedAsset
    });
  } catch (error) {
    console.error('Unassign asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return asset',
      error: error.message
    });
  }
};

// @desc    Add maintenance record
// @route   POST /api/v1/assets/:id/maintenance
// @access  Private (Admin, HR)
exports.addMaintenanceRecord = async (req, res) => {
  try {
    const { description, cost, performedBy, scheduledDate } = req.body;

    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    await asset.addMaintenanceRecord({
      description,
      cost,
      performedBy,
      scheduledDate,
      recordedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Maintenance record added successfully',
      data: asset
    });
  } catch (error) {
    console.error('Add maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add maintenance record',
      error: error.message
    });
  }
};

// @desc    Get asset statistics
// @route   GET /api/v1/assets/stats
// @access  Private (Admin, HR, Manager)
exports.getAssetStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalAssets,
      assignedAssets,
      availableAssets,
      maintenanceAssets,
      assetsByCategory
    ] = await Promise.all([
      Asset.count({ where: { organizationId, isActive: true } }),
      Asset.count({ where: { organizationId, status: 'assigned', isActive: true } }),
      Asset.count({ where: { organizationId, status: 'available', isActive: true } }),
      Asset.count({ where: { organizationId, status: 'maintenance', isActive: true } }),
      Asset.findAll({
        where: { organizationId, isActive: true },
        attributes: [
          'category',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['category']
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAssets,
        assignedAssets,
        availableAssets,
        maintenanceAssets,
        byCategory: assetsByCategory.reduce((acc, item) => {
          acc[item.category] = parseInt(item.get('count'));
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get asset stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset statistics',
      error: error.message
    });
  }
};

// @desc    Get my assigned assets
// @route   GET /api/v1/assets/my-assets
// @access  Private
exports.getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.findAll({
      where: {
        assignedToId: req.user.id,
        organizationId: req.user.organizationId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['assignedDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your assets',
      error: error.message
    });
  }
};

module.exports = exports;

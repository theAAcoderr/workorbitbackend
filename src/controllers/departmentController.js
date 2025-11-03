const { Department, User, Organization } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   POST /api/v1/departments
 * @desc    Create a new department
 * @access  Private (Admin, HR)
 */
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, managerId, parentDepartmentId, budgetAllocated, location, metadata } = req.body;
    const organizationId = req.user.organizationId;

    // Validate organization exists
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if code already exists in this organization
    const existingDept = await Department.findOne({
      where: {
        code: code.toUpperCase(),
        organizationId
      }
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists in this organization'
      });
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await User.findOne({
        where: {
          id: managerId,
          organizationId
        }
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found in this organization'
        });
      }
    }

    // Validate parent department if provided
    if (parentDepartmentId) {
      const parentDept = await Department.findOne({
        where: {
          id: parentDepartmentId,
          organizationId
        }
      });

      if (!parentDept) {
        return res.status(404).json({
          success: false,
          message: 'Parent department not found in this organization'
        });
      }
    }

    // Create department
    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      organizationId,
      managerId: managerId || null,
      parentDepartmentId: parentDepartmentId || null,
      budgetAllocated: budgetAllocated || 0,
      location,
      metadata: metadata || {},
      isActive: true
    });

    // Fetch complete department with associations
    const completeDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'parentDepartment',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: completeDepartment
    });
  } catch (error) {
    console.error('Create department error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments for organization
 * @access  Private
 */
exports.getDepartments = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { includeInactive = false, parentId, search } = req.query;

    const whereClause = { organizationId };

    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (parentId) {
      whereClause.parentDepartmentId = parentId === 'null' ? null : parentId;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const departments = await Department.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture']
        },
        {
          model: Department,
          as: 'parentDepartment',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Department,
          as: 'subDepartments',
          attributes: ['id', 'name', 'code', 'employeeCount']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
exports.getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'phone']
        },
        {
          model: Department,
          as: 'parentDepartment',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Department,
          as: 'subDepartments',
          attributes: ['id', 'name', 'code', 'employeeCount', 'isActive']
        },
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'designation']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department by ID error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department
 * @access  Private (Admin, HR)
 */
exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { name, code, description, managerId, parentDepartmentId, budgetAllocated, location, isActive, metadata } = req.body;

    const department = await Department.findOne({
      where: { id, organizationId }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if code is being changed and if it already exists
    if (code && code.toUpperCase() !== department.code) {
      const existingDept = await Department.findOne({
        where: {
          code: code.toUpperCase(),
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists'
        });
      }
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await User.findOne({
        where: {
          id: managerId,
          organizationId
        }
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found in this organization'
        });
      }
    }

    // Validate parent department if provided
    if (parentDepartmentId && parentDepartmentId !== department.id) {
      const parentDept = await Department.findOne({
        where: {
          id: parentDepartmentId,
          organizationId
        }
      });

      if (!parentDept) {
        return res.status(404).json({
          success: false,
          message: 'Parent department not found'
        });
      }

      // Prevent circular references
      if (parentDepartmentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be its own parent'
        });
      }
    }

    // Update department
    await department.update({
      name: name || department.name,
      code: code ? code.toUpperCase() : department.code,
      description: description !== undefined ? description : department.description,
      managerId: managerId !== undefined ? managerId : department.managerId,
      parentDepartmentId: parentDepartmentId !== undefined ? parentDepartmentId : department.parentDepartmentId,
      budgetAllocated: budgetAllocated !== undefined ? budgetAllocated : department.budgetAllocated,
      location: location !== undefined ? location : department.location,
      isActive: isActive !== undefined ? isActive : department.isActive,
      metadata: metadata !== undefined ? { ...department.metadata, ...metadata } : department.metadata
    });

    // Fetch updated department with associations
    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'parentDepartment',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    console.error('Update department error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Delete department
 * @access  Private (Admin)
 */
exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { id, organizationId }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees
    if (department.employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active employees. Please reassign employees first.'
      });
    }

    // Check if department has sub-departments
    const subDepartments = await Department.count({
      where: { parentDepartmentId: id }
    });

    if (subDepartments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with sub-departments. Please delete or reassign sub-departments first.'
      });
    }

    await department.destroy();

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/departments/:id/employees
 * @desc    Get all employees in a department
 * @access  Private
 */
exports.getDepartmentEmployees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { id, organizationId }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const employees = await User.findAll({
      where: {
        departmentId: id,
        organizationId
      },
      attributes: ['id', 'name', 'email', 'role', 'designation', 'profilePicture', 'phone', 'isActive'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code
      },
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Get department employees error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/departments/hierarchy/tree
 * @desc    Get department hierarchy tree
 * @access  Private
 */
exports.getDepartmentHierarchy = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    // Get all departments
    const departments = await Department.findAll({
      where: { organizationId, isActive: true },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Build hierarchy tree
    const buildTree = (parentId = null) => {
      return departments
        .filter(dept => dept.parentDepartmentId === parentId)
        .map(dept => ({
          ...dept.toJSON(),
          children: buildTree(dept.id)
        }));
    };

    const hierarchy = buildTree();

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Get department hierarchy error:', error);
    next(error);
  }
};


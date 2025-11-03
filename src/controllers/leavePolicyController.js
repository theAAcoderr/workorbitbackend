const { LeavePolicy, Organization } = require('../models');
const { sequelize } = require('../config/database');
const { auditLog } = require('../middleware/logger');

// Get all leave policies
const getLeavePolicies = async (req, res) => {
  try {
    const user = req.user;
    const { organizationId } = req.query;

    const where = {};
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    const policies = await LeavePolicy.findAll({
      where,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (error) {
    console.error('Get leave policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave policies'
    });
  }
};

// Get single leave policy
const getLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const policy = await LeavePolicy.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode']
        }
      ]
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found'
      });
    }

    // Check if user has access
    if (user.role !== 'admin' && policy.organizationId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this policy'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Get leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave policy'
    });
  }
};

// Create leave policy
const createLeavePolicy = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = req.user;
    const {
      name,
      type,
      totalDays,
      carryForwardDays,
      maxCarryForward,
      encashmentAllowed,
      minServiceMonths,
      applicableGender,
      description,
      organizationId
    } = req.body;

    // Validate permissions
    if (user.role !== 'admin' && user.role !== 'hr') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only admin and HR can create leave policies'
      });
    }

    // Validate organization access
    const targetOrgId = organizationId || user.organizationId;
    if (user.role === 'hr' && targetOrgId !== user.organizationId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'HR can only create policies for their organization'
      });
    }

    // Create policy
    const policy = await LeavePolicy.create({
      name,
      type,
      totalDays,
      carryForwardDays: carryForwardDays || 0,
      maxCarryForward: maxCarryForward || 0,
      encashmentAllowed: encashmentAllowed || false,
      minServiceMonths: minServiceMonths || 0,
      applicableGender: applicableGender || 'all',
      description,
      organizationId: targetOrgId,
      createdBy: user.id
    }, { transaction });

    await transaction.commit();

    // Audit log
    await auditLog('LEAVE_POLICY_CREATED', user.id, {
      policyId: policy.id,
      policyName: policy.name,
      type: policy.type
    }, req);

    res.status(201).json({
      success: true,
      message: 'Leave policy created successfully',
      data: policy
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave policy'
    });
  }
};

// Update leave policy
const updateLeavePolicy = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    const policy = await LeavePolicy.findByPk(id, { transaction });

    if (!policy) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found'
      });
    }

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'hr') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only admin and HR can update leave policies'
      });
    }

    if (user.role === 'hr' && policy.organizationId !== user.organizationId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'HR can only update policies for their organization'
      });
    }

    // Update policy
    await policy.update(updateData, { transaction });
    await transaction.commit();

    // Audit log
    await auditLog('LEAVE_POLICY_UPDATED', user.id, {
      policyId: policy.id,
      policyName: policy.name,
      changes: updateData
    }, req);

    res.json({
      success: true,
      message: 'Leave policy updated successfully',
      data: policy
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave policy'
    });
  }
};

// Delete leave policy
const deleteLeavePolicy = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const user = req.user;

    const policy = await LeavePolicy.findByPk(id, { transaction });

    if (!policy) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found'
      });
    }

    // Check permissions
    if (user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete leave policies'
      });
    }

    const policyName = policy.name;
    await policy.destroy({ transaction });
    await transaction.commit();

    // Audit log
    await auditLog('LEAVE_POLICY_DELETED', user.id, {
      policyId: id,
      policyName
    }, req);

    res.json({
      success: true,
      message: 'Leave policy deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave policy'
    });
  }
};

module.exports = {
  getLeavePolicies,
  getLeavePolicy,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy
};

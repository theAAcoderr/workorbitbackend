const { User, Organization, HRManager, JoinRequest } = require('../models');
const { generateHRCode, generateEmployeeId } = require('../utils/codeGenerator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Get all pending join requests for an organization
const getPendingRequests = async (req, res) => {
  try {
    const user = req.user;
    let organizationId;

    // Determine organization based on user role
    if (user.role === 'admin') {
      const org = await Organization.findOne({ where: { adminId: user.id } });
      organizationId = org?.id;
    } else if (user.role === 'hr') {
      const hrManager = await HRManager.findOne({ where: { userId: user.id } });
      organizationId = hrManager?.organizationId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only admin and HR can view join requests'
      });
    }

    if (!organizationId) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get pending requests based on user role
    const whereClause = {
      organizationId,
      status: 'pending'
    };

    // Filter based on user role
    if (user.role === 'hr') {
      // HR can only see staff requests that have their HR code
      whereClause.requestType = 'staff_join';
      // Get HR code from user or HRManager table
      if (user.hrCode) {
        whereClause.requestedHRCode = user.hrCode;
      } else {
        // Fallback: get HR code from HRManager table
        const hrManager = await HRManager.findOne({ where: { userId: user.id } });
        if (hrManager && hrManager.hrCode) {
          whereClause.requestedHRCode = hrManager.hrCode;
        } else {
          console.log('Warning: HR user has no HR code:', user.email);
          return res.json({
            success: true,
            data: []
          });
        }
      }
    } else if (user.role === 'admin') {
      // Admin can only see HR join requests for their organization
      // Staff requests are handled by HR managers only
      whereClause.requestType = 'hr_join';
    }

    console.log('getPendingRequests - User:', user.email, 'Role:', user.role, 'OrgId:', organizationId);
    console.log('getPendingRequests - User HR Code:', user.hrCode);
    console.log('getPendingRequests - Where clause:', JSON.stringify(whereClause, null, 2));

    const requests = await JoinRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'phone', 'requestedRole']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('getPendingRequests - Found', requests.length, 'requests');
    if (requests.length > 0) {
      console.log('First request type:', requests[0].requestType, 'role:', requests[0].requestedRole);
    }

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending requests',
      error: error.message
    });
  }
};

// Approve join request
const approveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { requestId } = req.params;
    const { department, designation } = req.body;
    const user = req.user;

    // Find the join request
    const joinRequest = await JoinRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: 'requester'
        },
        {
          model: Organization,
          as: 'organization'
        }
      ],
      transaction
    });

    if (!joinRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    if (joinRequest.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Verify permissions
    if (user.role === 'hr') {
      // HR can only approve staff requests
      if (joinRequest.requestType !== 'staff_join') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'HR can only approve staff join requests'
        });
      }

      // Verify HR belongs to the same organization
      const hrManager = await HRManager.findOne({
        where: { userId: user.id },
        transaction
      });
      if (!hrManager || hrManager.organizationId !== joinRequest.organizationId) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'You can only approve requests for your organization'
        });
      }
    } else if (user.role === 'admin') {
      // Verify admin owns the organization
      const org = await Organization.findOne({
        where: {
          id: joinRequest.organizationId,
          adminId: user.id
        },
        transaction
      });

      if (!org) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'You can only approve requests for your organization'
        });
      }
    } else {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only admin and HR can approve requests'
      });
    }

    const requesterUser = joinRequest.requester;
    const organization = joinRequest.organization;

    // Update user based on role
    if (joinRequest.requestedRole === 'hr') {
      // Generate HR code
      const hrCode = await generateHRCode(HRManager, organization.orgCode);

      // Create HR manager record
      await HRManager.create({
        hrCode,
        userId: requesterUser.id,
        organizationId: organization.id,
        orgCode: organization.orgCode
      }, { transaction });

      // Update user
      requesterUser.status = 'active';
      requesterUser.role = 'hr';
      requesterUser.hrCode = hrCode;
      requesterUser.orgCode = organization.orgCode;
      requesterUser.organizationId = organization.id;
      requesterUser.isAssigned = true;
      if (department) requesterUser.department = department;
      if (designation) requesterUser.designation = designation;
    } else {
      // Generate unique employee ID with retry mechanism
      let employeeId;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          employeeId = await generateEmployeeId(User, organization.id);
          break; // Success, exit loop
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to generate unique employee ID after multiple attempts');
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Get HR manager if staff was approved by HR
      let hrManagerId = null;
      if (user.role === 'hr') {
        const hrManager = await HRManager.findOne({
          where: { userId: user.id },
          transaction
        });
        hrManagerId = hrManager?.id;
      }

      // Update user
      requesterUser.status = 'active';
      requesterUser.role = joinRequest.requestedRole;
      requesterUser.employeeId = employeeId;
      requesterUser.organizationId = organization.id;
      requesterUser.orgCode = organization.orgCode;
      requesterUser.hrCode = joinRequest.requestedHRCode;
      requesterUser.isAssigned = true;
      requesterUser.dateOfJoining = new Date();
      if (department) requesterUser.department = department;
      if (designation) requesterUser.designation = designation;
    }

    await requesterUser.save({ transaction });

    // Update join request
    joinRequest.status = 'approved';
    joinRequest.approvedBy = user.id;
    joinRequest.respondedAt = new Date();
    joinRequest.responseMessage = `Approved by ${user.name}`;
    await joinRequest.save({ transaction });

    // Commit transaction
    await transaction.commit();

    res.json({
      success: true,
      message: 'Request approved successfully',
      data: {
        joinRequest,
        user: requesterUser.toJSON()
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Approve request error:', error);

    // Handle specific error types
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors.some(e => e.path === 'employeeId')) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID conflict. Please try again.'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to approve request'
    });
  }
};

// Reject join request
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const user = req.user;

    // Find the join request
    const joinRequest = await JoinRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: 'requester'
        }
      ]
    });

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Verify permissions (similar to approve)
    if (user.role === 'hr') {
      if (joinRequest.requestType !== 'staff_join') {
        return res.status(403).json({
          success: false,
          message: 'HR can only reject staff join requests'
        });
      }

      const hrManager = await HRManager.findOne({ where: { userId: user.id } });
      if (!hrManager || hrManager.organizationId !== joinRequest.organizationId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reject requests for your organization'
        });
      }
    } else if (user.role === 'admin') {
      const org = await Organization.findOne({ 
        where: { 
          id: joinRequest.organizationId,
          adminId: user.id 
        } 
      });
      
      if (!org) {
        return res.status(403).json({
          success: false,
          message: 'You can only reject requests for your organization'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only admin and HR can reject requests'
      });
    }

    // Update join request
    joinRequest.status = 'rejected';
    joinRequest.approvedBy = user.id;
    joinRequest.respondedAt = new Date();
    joinRequest.responseMessage = reason || `Rejected by ${user.name}`;
    await joinRequest.save();

    // Update user status
    const requesterUser = joinRequest.requester;
    requesterUser.status = 'inactive';
    await requesterUser.save();

    res.json({
      success: true,
      message: 'Request rejected successfully',
      data: joinRequest
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message
    });
  }
};

// Get organization hierarchy
const getOrganizationHierarchy = async (req, res) => {
  try {
    const user = req.user;
    let organizationId;

    // Get organization ID based on user
    if (user.organizationId) {
      organizationId = user.organizationId;
    } else if (user.role === 'admin') {
      const org = await Organization.findOne({ where: { adminId: user.id } });
      organizationId = org?.id;
    } else {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get organization with all members
    const organization = await Organization.findByPk(organizationId, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: HRManager,
          as: 'hrManagers',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role', 'department', 'designation']
          }]
        },
        {
          model: User,
          as: 'employees',
          where: { role: { [Op.in]: ['manager', 'employee'] } },
          attributes: ['id', 'name', 'email', 'role', 'department', 'designation', 'managerId'],
          required: false
        }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Build hierarchy structure
    const hierarchy = {
      organization: {
        id: organization.id,
        name: organization.name,
        orgCode: organization.orgCode
      },
      admin: organization.admin,
      hrManagers: organization.hrManagers.map(hr => ({
        ...hr.user.toJSON(),
        hrCode: hr.hrCode,
        permissions: hr.permissions
      })),
      managers: organization.employees.filter(e => e.role === 'manager'),
      employees: organization.employees.filter(e => e.role === 'employee')
    };

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization hierarchy',
      error: error.message
    });
  }
};

// Validate organization code
const validateOrgCode = async (req, res) => {
  try {
    const { code } = req.params;

    const organization = await Organization.findOne({
      where: { orgCode: code },
      attributes: ['id', 'name', 'orgCode']
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Invalid organization code',
        valid: false
      });
    }

    res.json({
      success: true,
      valid: true,
      data: {
        organizationName: organization.name,
        orgCode: organization.orgCode
      }
    });
  } catch (error) {
    console.error('Validate org code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate organization code',
      error: error.message
    });
  }
};

// Validate HR code
const validateHRCode = async (req, res) => {
  try {
    const { code } = req.params;

    const hrManager = await HRManager.findOne({
      where: { hrCode: code },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode']
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ]
    });

    if (!hrManager) {
      return res.status(404).json({
        success: false,
        message: 'Invalid HR code',
        valid: false
      });
    }

    res.json({
      success: true,
      valid: true,
      data: {
        hrName: hrManager.user.name,
        hrCode: hrManager.hrCode,
        organizationName: hrManager.organization.name,
        orgCode: hrManager.organization.orgCode
      }
    });
  } catch (error) {
    console.error('Validate HR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate HR code',
      error: error.message
    });
  }
};

module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getOrganizationHierarchy,
  validateOrgCode,
  validateHRCode
};
const {
  User,
  Organization,
  Leave,
  LeaveBalance,
  LeavePolicy,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const s3Service = require('../../services/s3.service');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

// Create Leave Request
const createLeave = async (req, res) => {
  try {
    const user = req.user;
    const {
      type,
      startDate,
      endDate,
      numberOfDays,
      duration,
      halfDayPeriod,
      reason
    } = req.body;

    let attachmentUrl = null;

    // Handle file upload to S3 if attachment is provided
    if (req.file) {
      console.log('📎 Uploading leave attachment to S3...');
      const uploadResult = await s3Service.uploadFile(req.file, 'leave-attachments');

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload attachment',
          error: uploadResult.error
        });
      }

      attachmentUrl = uploadResult.data.url;
      console.log('✅ Attachment uploaded successfully:', attachmentUrl);
    }

    // Check for leave conflicts
    const conflictingLeave = await Leave.findOne({
      where: {
        employeeId: user.id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for these dates'
      });
    }

    // Check leave balance
    const balance = await getOrCreateLeaveBalance(user.id, user.organizationId, type);
    
    if (balance.available < numberOfDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance.available}, Requested: ${numberOfDays}`
      });
    }

    // Create leave request
    const leave = await Leave.create({
      employeeId: user.id,
      organizationId: user.organizationId,
      managerId: user.managerId,
      hrCode: user.hrCode,
      teamId: user.teamId,
      departmentId: user.departmentId,
      type,
      startDate,
      endDate,
      numberOfDays,
      duration: duration || 'fullDay',
      halfDayPeriod,
      reason,
      attachmentUrl,
      status: 'pending',
      approvalHistory: [{
        action: 'created',
        by: user.id,
        byName: user.name,
        date: new Date(),
        comment: 'Leave request created'
      }]
    });

    // Update pending balance
    balance.pending = parseFloat(balance.pending) + parseFloat(numberOfDays);
    balance.available = parseFloat(balance.available) - parseFloat(numberOfDays);
    await balance.save();

    // 🔔 ADMIN NOTIFICATION: Emergency leave check
    // Check if it's emergency/urgent leave (same day or next day start)
    const startMoment = moment(startDate);
    const today = moment().startOf('day');
    const daysUntilLeave = startMoment.diff(today, 'days');

    if (daysUntilLeave <= 1 || type.toLowerCase().includes('sick') || type.toLowerCase().includes('emergency')) {
      await adminNotificationService.notifyEmergencyLeaveRequest(
        user.organizationId,
        {
          leaveId: leave.id,
          employeeId: user.id,
          employeeName: user.name,
          leaveType: type,
          startDate: startDate,
          endDate: endDate,
          days: numberOfDays,
          reason: reason || 'Not specified'
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    // Send notifications to manager and HR
    try {
      const leaveDates = `${moment(startDate).format('MMM DD')} - ${moment(endDate).format('MMM DD, YYYY')}`;
      const notificationData = {
        type: 'leave_request',
        leaveId: leave.id,
        employeeId: user.id,
        employeeName: user.name,
        leaveType: type,
        startDate: startDate,
        endDate: endDate,
        numberOfDays: numberOfDays,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      // Notify manager if exists
      if (user.managerId) {
        await oneSignalService.sendToUser(
          user.managerId.toString(),
          {
            title: `Leave Request from ${user.name}`,
            message: `${type} leave for ${numberOfDays} day(s) - ${leaveDates}`,
            data: notificationData
          }
        );
      }

      // Notify HR team
      await oneSignalService.sendToRole(
        user.organizationId,
        'hr',
        {
          title: `New Leave Request - ${user.name}`,
          message: `${type} leave for ${numberOfDays} day(s) - ${leaveDates}`,
          data: notificationData
        }
      );

      console.log('✅ Leave request notifications sent to manager and HR');
    } catch (notificationError) {
      console.error('⚠️ Failed to send leave request notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Leave request created successfully',
      data: leave
    });

  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message
    });
  }
};

// Get Employee Leaves
const getEmployeeLeaves = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate, status, type } = req.query;

    const whereClause = { employeeId: user.id };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] }
        },
        {
          endDate: { [Op.between]: [startDate, endDate] }
        }
      ];
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform leaves to include employee name (current user)
    const transformedLeaves = leaves.map(leave => {
      const leaveJson = leave.toJSON();
      return {
        ...leaveJson,
        employeeName: user.name || 'Unknown Employee',
        approverName: leaveJson.approver?.name,
        approver: leaveJson.approver
      };
    });

    res.json({
      success: true,
      data: transformedLeaves
    });

  } catch (error) {
    console.error('Get employee leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaves',
      error: error.message
    });
  }
};

// Get Pending Approvals (for managers/HR)
const getPendingApprovals = async (req, res) => {
  try {
    const user = req.user;
    const whereClause = { status: 'pending' };

    // Managers see their team's leave requests
    // HR sees only leave requests from employees with the same HR code
    // Admin sees all organization leave requests
    if (user.role === 'manager') {
      whereClause.managerId = user.id;
    } else if (user.role === 'hr' || user.role === 'hrManager') {
      whereClause.organizationId = user.organizationId;
      // HR can see all leaves in their organization
    } else if (user.role === 'admin') {
      whereClause.organizationId = user.organizationId; // Admin sees all
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view pending approvals'
      });
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Transform leaves to include employee name at root level
    const transformedLeaves = leaves.map(leave => {
      const leaveJson = leave.toJSON();
      return {
        ...leaveJson,
        employeeName: leaveJson.employee?.name || 'Unknown Employee',
        employee: leaveJson.employee // Keep the nested object as well
      };
    });

    res.json({
      success: true,
      data: transformedLeaves
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals',
      error: error.message
    });
  }
};

// Approve Leave
const approveLeave = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = req.user;
    const { leaveId } = req.params;
    const { comment } = req.body;

    const leave = await Leave.findByPk(leaveId, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }
      ],
      transaction
    });

    if (!leave) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    const canApprove =
      (user.role === 'manager' && leave.managerId === user.id) ||
      (user.role === 'hr' || user.role === 'hrManager' || user.role === 'admin');

    if (!canApprove) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to approve this leave'
      });
    }

    if (leave.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Leave is not in pending status'
      });
    }

    // Update leave status
    const approvalHistory = leave.approvalHistory || [];
    approvalHistory.push({
      action: 'approved',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      date: new Date(),
      comment: comment || 'Leave approved'
    });

    await leave.update({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
      approverComment: comment,
      approvalHistory
    }, { transaction });

    // Update leave balance
    const balance = await getOrCreateLeaveBalance(
      leave.employeeId,
      leave.organizationId,
      leave.type,
      transaction
    );

    balance.pending = Math.max(0, parseFloat(balance.pending) - parseFloat(leave.numberOfDays));
    balance.used = parseFloat(balance.used) + parseFloat(leave.numberOfDays);
    await balance.save({ transaction });

    // Commit transaction
    await transaction.commit();

    // Send notification to employee
    try {
      const leaveDates = `${moment(leave.startDate).format('MMM DD')} - ${moment(leave.endDate).format('MMM DD, YYYY')}`;

      await oneSignalService.sendToUser(
        leave.employeeId.toString(),
        {
          title: '✅ Leave Request Approved',
          message: `Your ${leave.type} leave (${leaveDates}) has been approved by ${user.name}`,
          data: {
            type: 'leave_approved',
            leaveId: leave.id,
            leaveType: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            numberOfDays: leave.numberOfDays,
            approvedBy: user.name,
            approverComment: comment,
            timestamp: new Date().toISOString()
          }
        }
      );

      console.log(`✅ Leave approval notification sent to employee: ${leave.employee.name}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send leave approval notification:', notificationError);
      // Don't fail the response if notification fails
    }

    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: leave
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave'
    });
  }
};

// Reject Leave
const rejectLeave = async (req, res) => {
  try {
    const user = req.user;
    const { leaveId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const leave = await Leave.findByPk(leaveId, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    const canReject = 
      (user.role === 'manager' && leave.managerId === user.id) ||
      (user.role === 'hr' || user.role === 'hrManager' || user.role === 'admin');

    if (!canReject) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reject this leave'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave is not in pending status'
      });
    }

    // Update leave status
    const approvalHistory = leave.approvalHistory || [];
    approvalHistory.push({
      action: 'rejected',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      date: new Date(),
      comment
    });

    await leave.update({
      status: 'rejected',
      approvedBy: user.id,
      approvedAt: new Date(),
      approverComment: comment,
      approvalHistory
    });

    // Restore leave balance
    const balance = await getOrCreateLeaveBalance(
      leave.employeeId,
      leave.organizationId,
      leave.type
    );
    
    balance.pending = Math.max(0, parseFloat(balance.pending) - parseFloat(leave.numberOfDays));
    balance.available = parseFloat(balance.available) + parseFloat(leave.numberOfDays);
    await balance.save();

    // Send notification to employee
    try {
      const leaveDates = `${moment(leave.startDate).format('MMM DD')} - ${moment(leave.endDate).format('MMM DD, YYYY')}`;

      await oneSignalService.sendToUser(
        leave.employeeId.toString(),
        {
          title: '❌ Leave Request Rejected',
          message: `Your ${leave.type} leave (${leaveDates}) was rejected by ${user.name}`,
          data: {
            type: 'leave_rejected',
            leaveId: leave.id,
            leaveType: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            numberOfDays: leave.numberOfDays,
            rejectedBy: user.name,
            rejectionReason: comment,
            timestamp: new Date().toISOString()
          }
        }
      );

      console.log(`✅ Leave rejection notification sent to employee: ${leave.employee.name}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send leave rejection notification:', notificationError);
      // Don't fail the response if notification fails
    }

    res.json({
      success: true,
      message: 'Leave rejected',
      data: leave
    });

  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave',
      error: error.message
    });
  }
};

// Withdraw Leave
const withdrawLeave = async (req, res) => {
  try {
    const user = req.user;
    const { leaveId } = req.params;

    const leave = await Leave.findOne({
      where: {
        id: leaveId,
        employeeId: user.id
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be withdrawn'
      });
    }

    // Update leave status
    const approvalHistory = leave.approvalHistory || [];
    approvalHistory.push({
      action: 'withdrawn',
      by: user.id,
      byName: user.name,
      date: new Date(),
      comment: 'Leave withdrawn by employee'
    });

    await leave.update({
      status: 'withdrawn',
      approvalHistory
    });

    // Restore leave balance
    const balance = await getOrCreateLeaveBalance(
      leave.employeeId,
      leave.organizationId,
      leave.type
    );
    
    balance.pending = Math.max(0, parseFloat(balance.pending) - parseFloat(leave.numberOfDays));
    balance.available = parseFloat(balance.available) + parseFloat(leave.numberOfDays);
    await balance.save();

    // Send notifications to manager and HR
    try {
      const leaveDates = `${moment(leave.startDate).format('MMM DD')} - ${moment(leave.endDate).format('MMM DD, YYYY')}`;
      const notificationData = {
        type: 'leave_withdrawn',
        leaveId: leave.id,
        employeeId: user.id,
        employeeName: user.name,
        leaveType: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        numberOfDays: leave.numberOfDays,
        timestamp: new Date().toISOString()
      };

      // Notify manager if exists
      if (user.managerId) {
        await oneSignalService.sendToUser(
          user.managerId.toString(),
          {
            title: `Leave Withdrawn - ${user.name}`,
            message: `${leave.type} leave (${leaveDates}) has been withdrawn`,
            data: notificationData
          }
        );
      }

      // Notify HR team
      await oneSignalService.sendToRole(
        user.organizationId,
        'hr',
        {
          title: `Leave Withdrawn - ${user.name}`,
          message: `${leave.type} leave (${leaveDates}) has been withdrawn`,
          data: notificationData
        }
      );

      console.log('✅ Leave withdrawal notifications sent to manager and HR');
    } catch (notificationError) {
      console.error('⚠️ Failed to send leave withdrawal notifications:', notificationError);
      // Don't fail the response if notification fails
    }

    res.json({
      success: true,
      message: 'Leave withdrawn successfully',
      data: leave
    });

  } catch (error) {
    console.error('Withdraw leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw leave',
      error: error.message
    });
  }
};

// Get Leave Balance
const getLeaveBalance = async (req, res) => {
  try {
    const user = req.user;
    const year = req.query.year || new Date().getFullYear();

    const balances = await LeaveBalance.findAll({
      where: {
        employeeId: user.id,
        organizationId: user.organizationId,
        year
      }
    });

    // Get or create default balances for all leave types
    const leaveTypes = ['sick', 'casual', 'earned'];
    const balanceData = {};

    for (const type of leaveTypes) {
      let balance = balances.find(b => b.leaveType === type);
      if (!balance) {
        balance = await getOrCreateLeaveBalance(user.id, user.organizationId, type, year);
      }
      balanceData[type] = {
        total: balance.totalAllowed,
        used: balance.used,
        pending: balance.pending,
        available: balance.available
      };
    }

    res.json({
      success: true,
      data: balanceData
    });

  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave balance',
      error: error.message
    });
  }
};

// Get Leave Policy
const getLeavePolicy = async (req, res) => {
  try {
    const user = req.user;

    const policies = await LeavePolicy.findAll({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: policies
    });

  } catch (error) {
    console.error('Get leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave policy',
      error: error.message
    });
  }
};

// Get Team Leaves (for managers)
const getTeamLeaves = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate, status } = req.query;

    if (user.role !== 'manager' && user.role !== 'hr' && user.role !== 'hrManager' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view team leaves'
      });
    }

    const whereClause = {};

    if (user.role === 'manager') {
      whereClause.managerId = user.id;
    } else if (user.role === 'hr' || user.role === 'hrManager') {
      whereClause.organizationId = user.organizationId;
      // HR can only see leaves from employees with the same hrCode
      if (user.hrCode) {
        whereClause.hrCode = user.hrCode;
      }
    } else if (user.role === 'admin') {
      whereClause.organizationId = user.organizationId; // Admin sees all
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] }
        },
        {
          endDate: { [Op.between]: [startDate, endDate] }
        }
      ];
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform leaves to include employee name at root level
    const transformedLeaves = leaves.map(leave => {
      const leaveJson = leave.toJSON();
      return {
        ...leaveJson,
        employeeName: leaveJson.employee?.name || 'Unknown Employee',
        approverName: leaveJson.approver?.name,
        employee: leaveJson.employee,
        approver: leaveJson.approver
      };
    });

    res.json({
      success: true,
      data: transformedLeaves
    });

  } catch (error) {
    console.error('Get team leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team leaves',
      error: error.message
    });
  }
};

// Check Leave Conflicts
const checkLeaveConflicts = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const conflictingLeave = await Leave.findOne({
      where: {
        employeeId: user.id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    res.json({
      success: true,
      hasConflict: !!conflictingLeave,
      conflictingLeave
    });

  } catch (error) {
    console.error('Check leave conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check leave conflicts',
      error: error.message
    });
  }
};

// Helper function to get or create leave balance
const getOrCreateLeaveBalance = async (employeeId, organizationId, leaveType, yearOrTransaction = new Date().getFullYear()) => {
  // Determine if yearOrTransaction is a transaction object or a year
  const isTransaction = yearOrTransaction && typeof yearOrTransaction === 'object' && yearOrTransaction.constructor.name === 'Transaction';
  const year = isTransaction ? new Date().getFullYear() : yearOrTransaction;
  const transaction = isTransaction ? yearOrTransaction : undefined;

  let balance = await LeaveBalance.findOne({
    where: {
      employeeId,
      organizationId,
      leaveType,
      year
    },
    transaction
  });

  if (!balance) {
    // Get policy for this leave type
    const policy = await LeavePolicy.findOne({
      where: {
        organizationId,
        leaveType,
        isActive: true
      },
      transaction
    });

    const totalAllowed = policy ? policy.annualQuota : getDefaultLeaveQuota(leaveType);

    balance = await LeaveBalance.create({
      employeeId,
      organizationId,
      year,
      leaveType,
      totalAllowed,
      used: 0,
      pending: 0,
      available: totalAllowed,
      carriedForward: 0
    }, { transaction });
  }

  return balance;
};

// Get default leave quota
const getDefaultLeaveQuota = (leaveType) => {
  const defaults = {
    'sick': 10,
    'casual': 12,
    'earned': 15,
    'maternity': 180,
    'paternity': 15,
    'compensatory': 0,
    'unpaid': 0,
    'other': 0
  };
  return defaults[leaveType] || 0;
};

module.exports = {
  createLeave,
  getEmployeeLeaves,
  getPendingApprovals,
  approveLeave,
  rejectLeave,
  withdrawLeave,
  getLeaveBalance,
  getLeavePolicy,
  getTeamLeaves,
  checkLeaveConflicts
};
const Exit = require('../models/Exit');
const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all exit processes for organization
 * @route   GET /api/v1/exit-management
 * @access  Private (All authenticated users - filtered by role)
 */
exports.getExitProcesses = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build query filters
    const whereClause = {
      organizationId
    };

    // If user is not admin or HR, only show their own exit processes
    if (userRole !== 'admin' && userRole !== 'hr') {
      whereClause.employeeId = userId;
    }

    if (status) {
      if (status === 'active') {
        // Active means initiated or in_progress
        whereClause.status = {
          [Op.in]: ['initiated', 'in_progress']
        };
      } else if (status === 'pending') {
        whereClause.status = 'initiated';
      } else if (status === 'completed') {
        whereClause.status = 'completed';
      } else {
        whereClause.status = status;
      }
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const exits = await Exit.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId', 'department', 'designation']
        },
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'handoverUser',
          attributes: ['id', 'name', 'email', 'department']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate checklist status for each exit
    const exitsWithChecklist = exits.map(exit => {
      const exitData = exit.toJSON();
      return {
        ...exitData,
        checklist: [
          {
            id: 'exitInterview',
            title: 'Exit Interview',
            completed: exitData.exitInterviewCompleted,
            completedDate: exitData.exitInterviewDate
          },
          {
            id: 'assetReturn',
            title: 'Asset Return',
            completed: exitData.assetReturnCompleted,
            completedDate: exitData.assetReturnDate
          },
          {
            id: 'settlement',
            title: 'Final Settlement',
            completed: exitData.settlementCompleted,
            completedDate: exitData.settlementDate
          },
          {
            id: 'accessRevocation',
            title: 'Access Revocation',
            completed: exitData.accessRevoked,
            completedDate: exitData.accessRevocationDate
          },
          {
            id: 'documentation',
            title: 'Documentation',
            completed: exitData.documentationCompleted,
            completedDate: exitData.documentationDate
          }
        ]
      };
    });

    res.status(200).json({
      success: true,
      count: exitsWithChecklist.length,
      data: exitsWithChecklist
    });
  } catch (error) {
    console.error('Error fetching exit processes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exit processes',
      error: error.message
    });
  }
};

/**
 * @desc    Get single exit process
 * @route   GET /api/v1/exit-management/:id
 * @access  Private (All authenticated users - ownership checked)
 */
exports.getExitProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;
    const userId = req.user.id;

    const whereClause = {
      id,
      organizationId
    };

    // If user is not admin or HR, only allow viewing their own exit
    if (userRole !== 'admin' && userRole !== 'hr') {
      whereClause.employeeId = userId;
    }

    const exit = await Exit.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId', 'department', 'designation', 'phone']
        },
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'handoverUser',
          attributes: ['id', 'name', 'email', 'department', 'designation']
        },
        {
          model: User,
          as: 'exitInterviewer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit process not found'
      });
    }

    // Add checklist
    const exitData = exit.toJSON();
    exitData.checklist = [
      {
        id: 'exitInterview',
        title: 'Exit Interview',
        completed: exitData.exitInterviewCompleted,
        completedDate: exitData.exitInterviewDate,
        notes: exitData.exitInterviewNotes,
        conductedBy: exitData.exitInterviewer
      },
      {
        id: 'assetReturn',
        title: 'Asset Return',
        completed: exitData.assetReturnCompleted,
        completedDate: exitData.assetReturnDate,
        notes: exitData.assetReturnNotes,
        assets: exitData.assetsReturned
      },
      {
        id: 'settlement',
        title: 'Final Settlement',
        completed: exitData.settlementCompleted,
        completedDate: exitData.settlementDate,
        notes: exitData.settlementNotes,
        amount: exitData.settlementAmount
      },
      {
        id: 'accessRevocation',
        title: 'Access Revocation',
        completed: exitData.accessRevoked,
        completedDate: exitData.accessRevocationDate,
        notes: exitData.accessRevocationNotes
      },
      {
        id: 'documentation',
        title: 'Documentation',
        completed: exitData.documentationCompleted,
        completedDate: exitData.documentationDate,
        notes: exitData.documentationNotes,
        documents: exitData.documents
      }
    ];

    res.status(200).json({
      success: true,
      data: exitData
    });
  } catch (error) {
    console.error('Error fetching exit process:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exit process',
      error: error.message
    });
  }
};

/**
 * @desc    Initiate exit process
 * @route   POST /api/v1/exit-management
 * @access  Private (Admin, HR only)
 */
exports.initiateExit = async (req, res) => {
  try {
    const {
      employeeId,
      exitType,
      resignationDate,
      lastWorkingDay,
      noticePeriod,
      exitReason,
      handoverTo,
      remarks
    } = req.body;

    const organizationId = req.user.organizationId;
    const initiatedBy = req.user.id;

    // Validate required fields
    if (!employeeId || !lastWorkingDay) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Last Working Day are required'
      });
    }

    // Check if employee exists and belongs to organization
    const employee = await User.findOne({
      where: {
        id: employeeId,
        organizationId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if exit process already exists for this employee
    const existingExit = await Exit.findOne({
      where: {
        employeeId,
        status: {
          [Op.in]: ['initiated', 'in_progress']
        }
      }
    });

    if (existingExit) {
      return res.status(400).json({
        success: false,
        message: 'An active exit process already exists for this employee'
      });
    }

    // Create exit process
    const exit = await Exit.create({
      employeeId,
      initiatedBy,
      organizationId,
      exitType: exitType || 'resignation',
      resignationDate,
      lastWorkingDay,
      noticePeriod,
      exitReason,
      handoverTo,
      remarks,
      status: 'initiated',
      progress: 0
    });

    // Fetch complete data with relations
    const completeExit = await Exit.findByPk(exit.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId', 'department', 'designation']
        },
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'handoverUser',
          attributes: ['id', 'name', 'email', 'department']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Exit process initiated successfully',
      data: completeExit
    });
  } catch (error) {
    console.error('Error initiating exit process:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating exit process',
      error: error.message
    });
  }
};

/**
 * @desc    Update exit process
 * @route   PUT /api/v1/exit-management/:id
 * @access  Private (Admin, HR only)
 */
exports.updateExitProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const exit = await Exit.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit process not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'exitType',
      'resignationDate',
      'lastWorkingDay',
      'noticePeriod',
      'exitReason',
      'handoverTo',
      'remarks',
      'rehireEligible'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        exit[field] = req.body[field];
      }
    });

    await exit.save();

    // Fetch updated data with relations
    const updatedExit = await Exit.findByPk(exit.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId', 'department', 'designation']
        },
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'handoverUser',
          attributes: ['id', 'name', 'email', 'department']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Exit process updated successfully',
      data: updatedExit
    });
  } catch (error) {
    console.error('Error updating exit process:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exit process',
      error: error.message
    });
  }
};

/**
 * @desc    Update checklist item
 * @route   PUT /api/v1/exit-management/:id/checklist
 * @access  Private (Admin, HR only)
 */
exports.updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, completed, notes, additionalData } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const exit = await Exit.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit process not found'
      });
    }

    // Validate item name
    const validItems = ['exitInterview', 'assetReturn', 'settlement', 'accessRevocation', 'documentation'];
    if (!validItems.includes(itemName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checklist item name'
      });
    }

    // Update checklist item
    await exit.updateChecklistItem(itemName, completed, {
      notes,
      ...(additionalData || {})
    });

    // Add conducted by for exit interview
    if (itemName === 'exitInterview' && completed) {
      exit.exitInterviewConductedBy = userId;
      await exit.save();
    }

    // Fetch updated data
    const updatedExit = await Exit.findByPk(exit.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profilePicture', 'employeeId']
        },
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Checklist item updated successfully',
      data: updatedExit
    });
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating checklist item',
      error: error.message
    });
  }
};

/**
 * @desc    Complete exit process
 * @route   POST /api/v1/exit-management/:id/complete
 * @access  Private (Admin, HR only)
 */
exports.completeExitProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const exit = await Exit.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit process not found'
      });
    }

    // Check if all checklist items are completed
    if (exit.progress < 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete exit process. All checklist items must be completed first.'
      });
    }

    await exit.markCompleted(userId);

    // Optionally update employee status to inactive
    const employee = await User.findByPk(exit.employeeId);
    if (employee) {
      employee.status = 'inactive';
      await employee.save();
    }

    const completedExit = await Exit.findByPk(exit.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Exit process completed successfully',
      data: completedExit
    });
  } catch (error) {
    console.error('Error completing exit process:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing exit process',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel exit process
 * @route   DELETE /api/v1/exit-management/:id
 * @access  Private (Admin, HR only)
 */
exports.cancelExitProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const organizationId = req.user.organizationId;

    const exit = await Exit.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit process not found'
      });
    }

    await exit.cancel(reason || 'No reason provided');

    res.status(200).json({
      success: true,
      message: 'Exit process cancelled successfully',
      data: exit
    });
  } catch (error) {
    console.error('Error cancelling exit process:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling exit process',
      error: error.message
    });
  }
};

/**
 * @desc    Get exit statistics
 * @route   GET /api/v1/exit-management/stats
 * @access  Private (Admin, HR only)
 */
exports.getExitStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [total, initiated, inProgress, completed, cancelled] = await Promise.all([
      Exit.count({ where: { organizationId } }),
      Exit.count({ where: { organizationId, status: 'initiated' } }),
      Exit.count({ where: { organizationId, status: 'in_progress' } }),
      Exit.count({ where: { organizationId, status: 'completed' } }),
      Exit.count({ where: { organizationId, status: 'cancelled' } })
    ]);

    // Get upcoming exits (next 30 days)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const upcomingExits = await Exit.count({
      where: {
        organizationId,
        lastWorkingDay: {
          [Op.between]: [today, futureDate]
        },
        status: {
          [Op.in]: ['initiated', 'in_progress']
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        active: initiated + inProgress,
        initiated,
        inProgress,
        completed,
        cancelled,
        upcomingExits
      }
    });
  } catch (error) {
    console.error('Error fetching exit statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exit statistics',
      error: error.message
    });
  }
};

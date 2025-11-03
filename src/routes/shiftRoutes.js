const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const {
  validateCreateShift,
  validateUpdateShift,
  validateCreateRoster,
  validateUpdateRoster,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateDeclineAssignment,
  validateRequestSwap,
  validateBulkAssign,
  validateShiftQuery,
  validateRosterQuery,
  validateAssignmentQuery,
  validateScheduleQuery,
  validateIdParam
} = require('../validators/shiftValidator');

// All routes require authentication
router.use(authMiddleware);

// ============= SHIFT ROUTES =============

/**
 * @route   POST /api/v1/shifts
 * @desc    Create a new shift
 * @access  Private (HR, Admin)
 */
router.post(
  '/',
  authorizeRoles('hr', 'admin'),
  // validateCreateShift, // Validation temporarily disabled
  shiftController.createShift
);

/**
 * @route   GET /api/v1/shifts
 * @desc    Get all shifts for organization
 * @access  Private
 */
router.get(
  '/',
  validateShiftQuery,
  shiftController.getShifts
);

// ============= ROSTER ROUTES =============

/**
 * @route   POST /api/v1/shifts/rosters
 * @desc    Create a new roster
 * @access  Private (HR, Admin, Manager)
 */
router.post(
  '/rosters',
  authorizeRoles('hr', 'admin', 'manager'),
  validateCreateRoster,
  shiftController.createRoster
);

/**
 * @route   GET /api/v1/shifts/rosters
 * @desc    Get all rosters for organization
 * @access  Private
 */
router.get(
  '/rosters',
  validateRosterQuery,
  shiftController.getRosters
);

/**
 * @route   GET /api/v1/shifts/rosters/:id
 * @desc    Get roster by ID
 * @access  Private
 */
router.get(
  '/rosters/:id',
  validateIdParam,
  shiftController.getRosterById
);

/**
 * @route   PUT /api/v1/shifts/rosters/:id
 * @desc    Update roster
 * @access  Private (HR, Admin, Manager)
 */
router.put(
  '/rosters/:id',
  authorizeRoles('hr', 'admin', 'manager'),
  validateUpdateRoster,
  shiftController.updateRoster
);

/**
 * @route   POST /api/v1/shifts/rosters/:id/publish
 * @desc    Publish roster
 * @access  Private (HR, Admin)
 */
router.post(
  '/rosters/:id/publish',
  authorizeRoles('hr', 'admin'),
  validateIdParam,
  shiftController.publishRoster
);

/**
 * @route   DELETE /api/v1/shifts/rosters/:id
 * @desc    Delete roster
 * @access  Private (HR, Admin)
 */
router.delete(
  '/rosters/:id',
  authorizeRoles('hr', 'admin'),
  validateIdParam,
  shiftController.deleteRoster
);

// ============= ASSIGNMENT ROUTES =============

/**
 * @route   POST /api/v1/shifts/assignments
 * @desc    Create a new assignment
 * @access  Private (HR, Admin, Manager)
 */
router.post(
  '/assignments',
  authorizeRoles('hr', 'admin', 'manager'),
  validateCreateAssignment,
  shiftController.createAssignment
);

/**
 * @route   GET /api/v1/shifts/assignments
 * @desc    Get all assignments
 * @access  Private
 */
router.get(
  '/assignments',
  validateAssignmentQuery,
  shiftController.getAssignments
);

/**
 * @route   GET /api/v1/shifts/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get(
  '/assignments/:id',
  validateIdParam,
  shiftController.getAssignmentById
);

/**
 * @route   PUT /api/v1/shifts/assignments/:id
 * @desc    Update assignment
 * @access  Private (HR, Admin, Manager)
 */
router.put(
  '/assignments/:id',
  authorizeRoles('hr', 'admin', 'manager'),
  validateUpdateAssignment,
  shiftController.updateAssignment
);

/**
 * @route   POST /api/v1/shifts/assignments/:id/confirm
 * @desc    Confirm assignment
 * @access  Private (Employee)
 */
router.post(
  '/assignments/:id/confirm',
  validateIdParam,
  shiftController.confirmAssignment
);

/**
 * @route   POST /api/v1/shifts/assignments/:id/decline
 * @desc    Decline assignment
 * @access  Private (Employee)
 */
router.post(
  '/assignments/:id/decline',
  validateDeclineAssignment,
  shiftController.declineAssignment
);

/**
 * @route   POST /api/v1/shifts/assignments/:id/request-swap
 * @desc    Request shift swap
 * @access  Private (Employee)
 */
router.post(
  '/assignments/:id/request-swap',
  validateRequestSwap,
  shiftController.requestSwap
);

/**
 * @route   POST /api/v1/shifts/assignments/:id/approve-swap
 * @desc    Approve shift swap
 * @access  Private (HR, Admin, Manager)
 */
router.post(
  '/assignments/:id/approve-swap',
  authorizeRoles('hr', 'admin', 'manager'),
  validateIdParam,
  shiftController.approveSwap
);

/**
 * @route   DELETE /api/v1/shifts/assignments/:id
 * @desc    Delete assignment
 * @access  Private (HR, Admin, Manager)
 */
router.delete(
  '/assignments/:id',
  authorizeRoles('hr', 'admin', 'manager'),
  validateIdParam,
  shiftController.deleteAssignment
);

// ============= SCHEDULE ROUTES =============

/**
 * @route   GET /api/v1/shifts/my-schedule
 * @desc    Get my shift schedule
 * @access  Private
 */
router.get(
  '/my-schedule',
  validateScheduleQuery,
  shiftController.getMySchedule
);

/**
 * @route   GET /api/v1/shifts/team-schedule
 * @desc    Get team shift schedule
 * @access  Private (Manager)
 */
router.get(
  '/team-schedule',
  authorizeRoles('manager', 'hr', 'admin'),
  validateScheduleQuery,
  shiftController.getTeamSchedule
);

// ============= BULK ROUTES =============

/**
 * @route   POST /api/v1/shifts/bulk-assign
 * @desc    Bulk assign shifts
 * @access  Private (HR, Admin, Manager)
 */
router.post(
  '/bulk-assign',
  authorizeRoles('hr', 'admin', 'manager'),
  validateBulkAssign,
  shiftController.bulkAssignShifts
);

// ============= DYNAMIC ID ROUTES (Must be last) =============

/**
 * @route   GET /api/v1/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateIdParam,
  shiftController.getShiftById
);

/**
 * @route   PUT /api/v1/shifts/:id
 * @desc    Update shift
 * @access  Private (HR, Admin)
 */
router.put(
  '/:id',
  authorizeRoles('hr', 'admin'),
  validateUpdateShift,
  shiftController.updateShift
);

/**
 * @route   DELETE /api/v1/shifts/:id
 * @desc    Delete shift
 * @access  Private (HR, Admin)
 */
router.delete(
  '/:id',
  authorizeRoles('hr', 'admin'),
  validateIdParam,
  shiftController.deleteShift
);

module.exports = router;
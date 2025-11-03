const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/teams
 * @desc    Get all teams for organization
 * @access  Private
 */
router.get('/', 
  cacheMiddleware(300), 
  teamController.getTeams
);

/**
 * @route   POST /api/v1/teams
 * @desc    Create a new team
 * @access  Private (Admin, HR, Manager)
 */
router.post('/', 
  authorizeRoles('admin', 'hr', 'manager'), 
  teamController.createTeam
);

/**
 * @route   GET /api/v1/teams/:id
 * @desc    Get team by ID
 * @access  Private
 */
router.get('/:id', 
  cacheMiddleware(300), 
  teamController.getTeamById
);

/**
 * @route   PUT /api/v1/teams/:id
 * @desc    Update team
 * @access  Private (Admin, HR, Manager)
 */
router.put('/:id', 
  authorizeRoles('admin', 'hr', 'manager'), 
  teamController.updateTeam
);

/**
 * @route   DELETE /api/v1/teams/:id
 * @desc    Delete team
 * @access  Private (Admin, HR)
 */
router.delete('/:id', 
  authorizeRoles('admin', 'hr'), 
  teamController.deleteTeam
);

/**
 * @route   POST /api/v1/teams/:id/members
 * @desc    Add members to team
 * @access  Private (Admin, HR, Manager)
 */
router.post('/:id/members', 
  authorizeRoles('admin', 'hr', 'manager'), 
  teamController.addTeamMembers
);

/**
 * @route   DELETE /api/v1/teams/:id/members/:userId
 * @desc    Remove member from team
 * @access  Private (Admin, HR, Manager)
 */
router.delete('/:id/members/:userId', 
  authorizeRoles('admin', 'hr', 'manager'), 
  teamController.removeTeamMember
);

/**
 * @route   GET /api/v1/teams/:id/members
 * @desc    Get all team members
 * @access  Private
 */
router.get('/:id/members', 
  cacheMiddleware(180), 
  teamController.getTeamMembers
);

module.exports = router;


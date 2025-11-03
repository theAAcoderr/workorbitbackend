const { Team, TeamMember, User, Department, Organization } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @route   POST /api/v1/teams
 * @desc    Create a new team
 * @access  Private (Admin, HR, Manager)
 */
exports.createTeam = async (req, res, next) => {
  try {
    const { name, description, departmentId, teamLeadId, teamType, maxMembers, startDate, endDate, metadata, memberIds } = req.body;
    const organizationId = req.user.organizationId;

    // Validate organization
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Validate department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: { id: departmentId, organizationId }
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found in this organization'
        });
      }
    }

    // Validate team lead if provided
    if (teamLeadId) {
      const teamLead = await User.findOne({
        where: { id: teamLeadId, organizationId }
      });

      if (!teamLead) {
        return res.status(404).json({
          success: false,
          message: 'Team lead not found in this organization'
        });
      }
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      organizationId,
      departmentId: departmentId || null,
      teamLeadId: teamLeadId || null,
      teamType: teamType || 'functional',
      maxMembers: maxMembers || null,
      currentMemberCount: 0,
      startDate: startDate || null,
      endDate: endDate || null,
      metadata: metadata || {},
      isActive: true
    });

    // Add team members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const validMembers = await User.findAll({
        where: {
          id: { [Op.in]: memberIds },
          organizationId
        }
      });

      if (validMembers.length > 0) {
        const teamMembersData = validMembers.map(member => ({
          teamId: team.id,
          userId: member.id,
          role: member.id === teamLeadId ? 'lead' : 'member',
          isActive: true
        }));

        await TeamMember.bulkCreate(teamMembersData);

        // Update member count
        await team.update({ currentMemberCount: validMembers.length });
      }
    }

    // Fetch complete team with associations
    const completeTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'teamLead',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt', 'isActive'] },
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'designation']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: completeTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/teams
 * @desc    Get all teams for organization
 * @access  Private
 */
exports.getTeams = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { includeInactive = false, departmentId, teamType, search } = req.query;

    const whereClause = { organizationId };

    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (teamType) {
      whereClause.teamType = teamType;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const teams = await Team.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teamLead',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'members',
          through: { 
            attributes: ['role', 'joinedAt'],
            where: { isActive: true }
          },
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/teams/:id
 * @desc    Get team by ID
 * @access  Private
 */
exports.getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const team = await Team.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'teamLead',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'phone', 'designation']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'members',
          through: { 
            attributes: ['role', 'joinedAt', 'leftAt', 'isActive']
          },
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'designation', 'phone']
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/teams/:id
 * @desc    Update team
 * @access  Private (Admin, HR, Manager)
 */
exports.updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { name, description, departmentId, teamLeadId, teamType, maxMembers, startDate, endDate, isActive, metadata } = req.body;

    const team = await Team.findOne({
      where: { id, organizationId }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Validate department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: { id: departmentId, organizationId }
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Validate team lead if provided
    if (teamLeadId) {
      const teamLead = await User.findOne({
        where: { id: teamLeadId, organizationId }
      });

      if (!teamLead) {
        return res.status(404).json({
          success: false,
          message: 'Team lead not found in this organization'
        });
      }

      // Add team lead to members if not already
      const isMember = await TeamMember.findOne({
        where: { teamId: id, userId: teamLeadId }
      });

      if (!isMember) {
        await TeamMember.create({
          teamId: id,
          userId: teamLeadId,
          role: 'lead',
          isActive: true
        });

        await team.increment('currentMemberCount');
      } else {
        await isMember.update({ role: 'lead' });
      }
    }

    // Update team
    await team.update({
      name: name || team.name,
      description: description !== undefined ? description : team.description,
      departmentId: departmentId !== undefined ? departmentId : team.departmentId,
      teamLeadId: teamLeadId !== undefined ? teamLeadId : team.teamLeadId,
      teamType: teamType || team.teamType,
      maxMembers: maxMembers !== undefined ? maxMembers : team.maxMembers,
      startDate: startDate !== undefined ? startDate : team.startDate,
      endDate: endDate !== undefined ? endDate : team.endDate,
      isActive: isActive !== undefined ? isActive : team.isActive,
      metadata: metadata !== undefined ? { ...team.metadata, ...metadata } : team.metadata
    });

    // Fetch updated team
    const updatedTeam = await Team.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teamLead',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/teams/:id
 * @desc    Delete team
 * @access  Private (Admin, HR)
 */
exports.deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const team = await Team.findOne({
      where: { id, organizationId }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Delete team members first
    await TeamMember.destroy({
      where: { teamId: id }
    });

    // Delete team
    await team.destroy();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/v1/teams/:id/members
 * @desc    Add members to team
 * @access  Private (Admin, HR, Manager)
 */
exports.addTeamMembers = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const organizationId = req.user.organizationId;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Member IDs array is required'
      });
    }

    const team = await Team.findOne({
      where: { id, organizationId },
      transaction
    });

    if (!team) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check max members limit
    if (team.maxMembers && (team.currentMemberCount + memberIds.length) > team.maxMembers) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot add members. Team capacity is ${team.maxMembers} and currently has ${team.currentMemberCount} members.`
      });
    }

    // Validate all members exist in organization
    const users = await User.findAll({
      where: {
        id: { [Op.in]: memberIds },
        organizationId
      },
      transaction
    });

    if (users.length !== memberIds.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Some users not found in organization'
      });
    }

    // Check for existing members
    const existingMembers = await TeamMember.findAll({
      where: {
        teamId: id,
        userId: { [Op.in]: memberIds }
      },
      transaction
    });

    const existingMemberIds = existingMembers.map(m => m.userId);
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'All users are already team members'
      });
    }

    // Add new members
    const teamMembersData = newMemberIds.map(userId => ({
      teamId: id,
      userId,
      role: 'member',
      isActive: true
    }));

    await TeamMember.bulkCreate(teamMembersData, { transaction });

    // Update member count
    await team.increment('currentMemberCount', { 
      by: newMemberIds.length,
      transaction 
    });

    await transaction.commit();

    // Fetch updated team
    const updatedTeam = await Team.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          through: { 
            attributes: ['role', 'joinedAt'],
            where: { isActive: true }
          },
          attributes: ['id', 'name', 'email', 'role', 'profilePicture']
        }
      ]
    });

    res.json({
      success: true,
      message: `${newMemberIds.length} member(s) added successfully`,
      data: updatedTeam
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Add team members error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/teams/:id/members/:userId
 * @desc    Remove member from team
 * @access  Private (Admin, HR, Manager)
 */
exports.removeTeamMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id, userId } = req.params;
    const organizationId = req.user.organizationId;

    const team = await Team.findOne({
      where: { id, organizationId },
      transaction
    });

    if (!team) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const teamMember = await TeamMember.findOne({
      where: { teamId: id, userId },
      transaction
    });

    if (!teamMember) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }

    // Soft delete by updating isActive and leftAt
    await teamMember.update({
      isActive: false,
      leftAt: new Date()
    }, { transaction });

    // Update member count
    await team.decrement('currentMemberCount', { transaction });

    // If removed user was team lead, unset team lead
    if (team.teamLeadId === parseInt(userId)) {
      await team.update({ teamLeadId: null }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Member removed from team successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Remove team member error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/teams/:id/members
 * @desc    Get all team members
 * @access  Private
 */
exports.getTeamMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { includeInactive = false } = req.query;

    const team = await Team.findOne({
      where: { id, organizationId }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const whereClause = { teamId: id };
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const members = await TeamMember.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'designation', 'phone']
        }
      ],
      order: [['joinedAt', 'DESC']]
    });

    res.json({
      success: true,
      team: {
        id: team.id,
        name: team.name
      },
      count: members.length,
      members
    });
  } catch (error) {
    console.error('Get team members error:', error);
    next(error);
  }
};


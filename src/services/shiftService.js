const { Shift, ShiftRoster, ShiftAssignment, User, Organization } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class ShiftService {
  // ============= SHIFT OPERATIONS =============

  async createShift(shiftData, creatorId) {
    try {
      const shift = await Shift.create({
        ...shiftData,
        createdBy: creatorId
      });

      return await this.getShiftById(shift.id);
    } catch (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }
  }

  async getShifts(organizationId, filters = {}) {
    try {
      const where = {
        organizationId,
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.hrCode && { hrCode: filters.hrCode }),
        ...(filters.isNightShift !== undefined && { isNightShift: filters.isNightShift })
      };

      const shifts = await Shift.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return shifts;
    } catch (error) {
      throw new Error(`Failed to get shifts: ${error.message}`);
    }
  }

  async getShiftById(shiftId) {
    try {
      const shift = await Shift.findByPk(shiftId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ShiftAssignment,
            as: 'assignments',
            include: [
              {
                model: User,
                as: 'employee',
                attributes: ['id', 'name', 'email', 'role']
              }
            ]
          }
        ]
      });

      if (!shift) {
        throw new Error('Shift not found');
      }

      return shift;
    } catch (error) {
      throw new Error(`Failed to get shift: ${error.message}`);
    }
  }

  async updateShift(shiftId, updateData, userId) {
    try {
      const shift = await Shift.findByPk(shiftId);

      if (!shift) {
        throw new Error('Shift not found');
      }

      await shift.update({
        ...updateData,
        updatedBy: userId
      });

      return await this.getShiftById(shiftId);
    } catch (error) {
      throw new Error(`Failed to update shift: ${error.message}`);
    }
  }

  async deleteShift(shiftId) {
    try {
      const shift = await Shift.findByPk(shiftId);

      if (!shift) {
        throw new Error('Shift not found');
      }

      // Check if there are active assignments
      const activeAssignments = await ShiftAssignment.count({
        where: {
          shiftId,
          date: {
            [Op.gte]: moment().startOf('day').toDate()
          }
        }
      });

      if (activeAssignments > 0) {
        throw new Error('Cannot delete shift with active assignments');
      }

      await shift.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }
  }

  // ============= ROSTER OPERATIONS =============

  async createRoster(rosterData, creatorId) {
    try {
      const roster = await ShiftRoster.create({
        ...rosterData,
        createdBy: creatorId
      });

      return await this.getRosterById(roster.id);
    } catch (error) {
      throw new Error(`Failed to create roster: ${error.message}`);
    }
  }

  async getRosters(organizationId, filters = {}) {
    try {
      const where = {
        organizationId,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.hrCode && { hrCode: filters.hrCode }),
        ...(filters.status && { status: filters.status }),
        ...(filters.isPublished !== undefined && { isPublished: filters.isPublished })
      };

      // Date range filter
      if (filters.startDate || filters.endDate) {
        where[Op.or] = [];
        if (filters.startDate) {
          where[Op.or].push({
            endDate: {
              [Op.gte]: filters.startDate
            }
          });
        }
        if (filters.endDate) {
          where[Op.or].push({
            startDate: {
              [Op.lte]: filters.endDate
            }
          });
        }
      }

      const rosters = await ShiftRoster.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'publisher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ShiftAssignment,
            as: 'assignments',
            include: [
              {
                model: Shift,
                as: 'shift',
                attributes: ['id', 'name', 'startTime', 'endTime']
              },
              {
                model: User,
                as: 'employee',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        order: [['startDate', 'DESC']]
      });

      return rosters;
    } catch (error) {
      throw new Error(`Failed to get rosters: ${error.message}`);
    }
  }

  async getRosterById(rosterId) {
    try {
      const roster = await ShiftRoster.findByPk(rosterId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'publisher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ShiftAssignment,
            as: 'assignments',
            include: [
              {
                model: Shift,
                as: 'shift'
              },
              {
                model: User,
                as: 'employee',
                attributes: ['id', 'name', 'email', 'role', 'department']
              }
            ]
          }
        ]
      });

      if (!roster) {
        throw new Error('Roster not found');
      }

      return roster;
    } catch (error) {
      throw new Error(`Failed to get roster: ${error.message}`);
    }
  }

  async updateRoster(rosterId, updateData, userId) {
    try {
      const roster = await ShiftRoster.findByPk(rosterId);

      if (!roster) {
        throw new Error('Roster not found');
      }

      await roster.update({
        ...updateData,
        updatedBy: userId
      });

      return await this.getRosterById(rosterId);
    } catch (error) {
      throw new Error(`Failed to update roster: ${error.message}`);
    }
  }

  async publishRoster(rosterId, userId) {
    try {
      const roster = await ShiftRoster.findByPk(rosterId);

      if (!roster) {
        throw new Error('Roster not found');
      }

      if (roster.isPublished) {
        throw new Error('Roster is already published');
      }

      await roster.update({
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: userId,
        status: 'published',
        updatedBy: userId
      });

      // TODO: Send notifications to affected employees

      return await this.getRosterById(rosterId);
    } catch (error) {
      throw new Error(`Failed to publish roster: ${error.message}`);
    }
  }

  async deleteRoster(rosterId) {
    try {
      const roster = await ShiftRoster.findByPk(rosterId);

      if (!roster) {
        throw new Error('Roster not found');
      }

      if (roster.isPublished) {
        throw new Error('Cannot delete published roster');
      }

      await roster.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete roster: ${error.message}`);
    }
  }

  // ============= ASSIGNMENT OPERATIONS =============

  async createAssignment(assignmentData, creatorId) {
    try {
      // Check if employee already has a shift on this date
      const existingAssignment = await ShiftAssignment.findOne({
        where: {
          employeeId: assignmentData.employeeId,
          date: assignmentData.date,
          shiftId: assignmentData.shiftId
        }
      });

      if (existingAssignment) {
        throw new Error('Employee already has this shift assigned on this date');
      }

      const assignment = await ShiftAssignment.create({
        ...assignmentData,
        createdBy: creatorId
      });

      return await this.getAssignmentById(assignment.id);
    } catch (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }
  }

  async getAssignments(organizationId, filters = {}) {
    try {
      const where = {
        organizationId,
        ...(filters.employeeId && { employeeId: filters.employeeId }),
        ...(filters.shiftId && { shiftId: filters.shiftId }),
        ...(filters.rosterId && { rosterId: filters.rosterId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.hrCode && { hrCode: filters.hrCode })
      };

      // Date filters
      if (filters.date) {
        where.date = filters.date;
      } else if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          where.date[Op.lte] = filters.endDate;
        }
      }

      const assignments = await ShiftAssignment.findAll({
        where,
        include: [
          {
            model: Shift,
            as: 'shift',
            attributes: ['id', 'name', 'startTime', 'endTime', 'color']
          },
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'name', 'email', 'role', 'department']
          },
          {
            model: ShiftRoster,
            as: 'roster',
            attributes: ['id', 'name', 'isPublished']
          }
        ],
        order: [['date', 'ASC'], ['createdAt', 'DESC']]
      });

      return assignments;
    } catch (error) {
      throw new Error(`Failed to get assignments: ${error.message}`);
    }
  }

  async getAssignmentById(assignmentId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId, {
        include: [
          {
            model: Shift,
            as: 'shift'
          },
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'name', 'email', 'role', 'department']
          },
          {
            model: ShiftRoster,
            as: 'roster'
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      return assignment;
    } catch (error) {
      throw new Error(`Failed to get assignment: ${error.message}`);
    }
  }

  async updateAssignment(assignmentId, updateData, userId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      await assignment.update({
        ...updateData,
        updatedBy: userId
      });

      return await this.getAssignmentById(assignmentId);
    } catch (error) {
      throw new Error(`Failed to update assignment: ${error.message}`);
    }
  }

  async confirmAssignment(assignmentId, employeeId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.employeeId !== employeeId) {
        throw new Error('You can only confirm your own assignments');
      }

      await assignment.update({
        status: 'confirmed',
        confirmedAt: new Date()
      });

      return await this.getAssignmentById(assignmentId);
    } catch (error) {
      throw new Error(`Failed to confirm assignment: ${error.message}`);
    }
  }

  async declineAssignment(assignmentId, employeeId, reason) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.employeeId !== employeeId) {
        throw new Error('You can only decline your own assignments');
      }

      await assignment.update({
        status: 'declined',
        declinedAt: new Date(),
        declineReason: reason
      });

      return await this.getAssignmentById(assignmentId);
    } catch (error) {
      throw new Error(`Failed to decline assignment: ${error.message}`);
    }
  }

  async requestSwap(assignmentId, employeeId, swapWithEmployeeId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.employeeId !== employeeId) {
        throw new Error('You can only request swaps for your own assignments');
      }

      await assignment.update({
        status: 'swap_requested',
        swapRequestedWith: swapWithEmployeeId,
        swapRequestedAt: new Date()
      });

      // TODO: Send notification to the other employee

      return await this.getAssignmentById(assignmentId);
    } catch (error) {
      throw new Error(`Failed to request swap: ${error.message}`);
    }
  }

  async approveSwap(assignmentId, approverId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.status !== 'swap_requested') {
        throw new Error('No swap request pending for this assignment');
      }

      // Create new assignment for the swap employee
      await ShiftAssignment.create({
        organizationId: assignment.organizationId,
        hrCode: assignment.hrCode,
        rosterId: assignment.rosterId,
        shiftId: assignment.shiftId,
        employeeId: assignment.swapRequestedWith,
        date: assignment.date,
        status: 'assigned',
        createdBy: approverId
      });

      // Cancel original assignment
      await assignment.update({
        status: 'cancelled',
        swapApprovedBy: approverId,
        swapApprovedAt: new Date()
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to approve swap: ${error.message}`);
    }
  }

  async deleteAssignment(assignmentId) {
    try {
      const assignment = await ShiftAssignment.findByPk(assignmentId);

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      await assignment.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  }

  // ============= EMPLOYEE SCHEDULE OPERATIONS =============

  async getEmployeeSchedule(employeeId, startDate, endDate) {
    try {
      const assignments = await ShiftAssignment.findAll({
        where: {
          employeeId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Shift,
            as: 'shift'
          },
          {
            model: ShiftRoster,
            as: 'roster',
            attributes: ['id', 'name', 'isPublished']
          }
        ],
        order: [['date', 'ASC']]
      });

      return assignments;
    } catch (error) {
      throw new Error(`Failed to get employee schedule: ${error.message}`);
    }
  }

  async getTeamSchedule(managerId, date) {
    try {
      // Get team members
      const teamMembers = await User.findAll({
        where: {
          managerId
        },
        attributes: ['id', 'name', 'email']
      });

      const teamMemberIds = teamMembers.map(member => member.id);

      const assignments = await ShiftAssignment.findAll({
        where: {
          employeeId: {
            [Op.in]: teamMemberIds
          },
          date
        },
        include: [
          {
            model: Shift,
            as: 'shift'
          },
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'name', 'email', 'role']
          }
        ],
        order: [['employeeId', 'ASC']]
      });

      return assignments;
    } catch (error) {
      throw new Error(`Failed to get team schedule: ${error.message}`);
    }
  }

  // ============= BULK OPERATIONS =============

  async bulkAssignShifts(assignments, creatorId) {
    try {
      const assignmentPromises = assignments.map(assignment =>
        this.createAssignment(assignment, creatorId)
      );

      const results = await Promise.allSettled(assignmentPromises);

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      return {
        successful,
        failed,
        totalSuccess: successful.length,
        totalFailed: failed.length
      };
    } catch (error) {
      throw new Error(`Failed to bulk assign shifts: ${error.message}`);
    }
  }

  async generateRosterAssignments(rosterId, pattern = 'weekly') {
    try {
      const roster = await ShiftRoster.findByPk(rosterId);

      if (!roster) {
        throw new Error('Roster not found');
      }

      // TODO: Implement auto-generation logic based on pattern
      // This would analyze employee availability, skills, preferences, etc.

      throw new Error('Auto-generation not yet implemented');
    } catch (error) {
      throw new Error(`Failed to generate roster assignments: ${error.message}`);
    }
  }
}

module.exports = new ShiftService();
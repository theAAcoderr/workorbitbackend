const shiftService = require('../services/shiftService');
const { validationResult } = require('express-validator');
const oneSignalService = require('../services/oneSignalService');

// Helper function to normalize time format
function normalizeTimeFormat(timeString) {
  if (typeof timeString !== 'string') return timeString;

  const parts = timeString.split(':');
  if (parts.length !== 2) return timeString;

  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');

  return `${hours}:${minutes}`;
}

// Helper function to convert Flutter color integer to hex
function convertFlutterColorToHex(colorInt) {
  // Flutter color is 32-bit ARGB, convert to hex
  const hex = (colorInt >>> 0).toString(16).padStart(8, '0');
  // Return RGB part with # prefix (ignore alpha channel for now)
  return `#${hex.substring(2)}`;
}

class ShiftController {
  // ============= SHIFT ENDPOINTS =============

  async createShift(req, res) {
    try {
      // Transform data before validation
      const transformedBody = { ...req.body };

      // Normalize time format (convert "9:0" to "09:00")
      if (transformedBody.startTime) {
        transformedBody.startTime = normalizeTimeFormat(transformedBody.startTime);
      }
      if (transformedBody.endTime) {
        transformedBody.endTime = normalizeTimeFormat(transformedBody.endTime);
      }

      // Convert Flutter color integer to hex string
      if (transformedBody.color && typeof transformedBody.color === 'number') {
        transformedBody.color = convertFlutterColorToHex(transformedBody.color);
      }

      // Update req.body with transformed data
      req.body = transformedBody;

      // Validation temporarily disabled
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Validation failed',
      //     errors: errors.array()
      //   });
      // }

      // Get the actual organization UUID from the user, not the org code
      const shiftData = {
        ...req.body,
        organizationId: req.user.organizationId || req.body.organizationId
      };

      const shift = await shiftService.createShift(shiftData, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: shift
      });
    } catch (error) {
      console.error('Create shift error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getShifts(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.orgCode;
      const filters = {
        isActive: req.query.isActive,
        hrCode: req.query.hrCode || req.user.hrCode,
        isNightShift: req.query.isNightShift
      };

      const shifts = await shiftService.getShifts(organizationId, filters);

      res.json({
        success: true,
        data: shifts
      });
    } catch (error) {
      console.error('Get shifts error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getShiftById(req, res) {
    try {
      const shift = await shiftService.getShiftById(req.params.id);

      res.json({
        success: true,
        data: shift
      });
    } catch (error) {
      console.error('Get shift error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateShift(req, res) {
    try {
      console.log('🔄 Update shift request:', {
        params: req.params,
        body: req.body,
        user: req.user.id
      });

      // Transform data before validation
      const transformedBody = { ...req.body };

      // Normalize time format (convert "9:0" to "09:00")
      if (transformedBody.startTime) {
        transformedBody.startTime = normalizeTimeFormat(transformedBody.startTime);
      }
      if (transformedBody.endTime) {
        transformedBody.endTime = normalizeTimeFormat(transformedBody.endTime);
      }

      // Convert Flutter color integer to hex string
      if (transformedBody.color && typeof transformedBody.color === 'number') {
        transformedBody.color = convertFlutterColorToHex(transformedBody.color);
      }

      // Update req.body with transformed data
      req.body = transformedBody;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const shift = await shiftService.updateShift(
        req.params.id,
        req.body,
        req.user.id
      );

      console.log('✅ Shift updated successfully:', shift.id);
      res.json({
        success: true,
        message: 'Shift updated successfully',
        data: shift
      });
    } catch (error) {
      console.error('❌ Update shift error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteShift(req, res) {
    try {
      await shiftService.deleteShift(req.params.id);

      res.json({
        success: true,
        message: 'Shift deleted successfully'
      });
    } catch (error) {
      console.error('Delete shift error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= ROSTER ENDPOINTS =============

  async createRoster(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const roster = await shiftService.createRoster(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Roster created successfully',
        data: roster
      });
    } catch (error) {
      console.error('Create roster error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRosters(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.orgCode;
      const filters = {
        departmentId: req.query.departmentId,
        hrCode: req.query.hrCode || req.user.hrCode,
        status: req.query.status,
        isPublished: req.query.isPublished,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const rosters = await shiftService.getRosters(organizationId, filters);

      res.json({
        success: true,
        data: rosters
      });
    } catch (error) {
      console.error('Get rosters error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRosterById(req, res) {
    try {
      const roster = await shiftService.getRosterById(req.params.id);

      res.json({
        success: true,
        data: roster
      });
    } catch (error) {
      console.error('Get roster error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateRoster(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const roster = await shiftService.updateRoster(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Roster updated successfully',
        data: roster
      });
    } catch (error) {
      console.error('Update roster error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async publishRoster(req, res) {
    try {
      const roster = await shiftService.publishRoster(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Roster published successfully',
        data: roster
      });
    } catch (error) {
      console.error('Publish roster error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteRoster(req, res) {
    try {
      await shiftService.deleteRoster(req.params.id);

      res.json({
        success: true,
        message: 'Roster deleted successfully'
      });
    } catch (error) {
      console.error('Delete roster error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= ASSIGNMENT ENDPOINTS =============

  async createAssignment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assignmentData = {
        ...req.body,
        organizationId: req.user.organizationId || req.user.orgCode,
        hrCode: req.user.hrCode
      };

      const assignment = await shiftService.createAssignment(
        assignmentData,
        req.user.id
      );

      // Send notification to employee about shift assignment
      if (assignment.employeeId) {
        try {
          const shiftDate = assignment.date ? new Date(assignment.date).toLocaleDateString() : 'upcoming';
          await oneSignalService.sendToUser(
            assignment.employeeId.toString(),
            {
              title: '📅 Shift Assigned',
              message: `You have been assigned a shift on ${shiftDate}`,
              data: {
                type: 'shift_assigned',
                assignmentId: assignment.id,
                shiftId: assignment.shiftId,
                date: assignment.date,
                startTime: assignment.startTime,
                endTime: assignment.endTime,
                timestamp: new Date().toISOString()
              }
            }
          );
          console.log(`✅ Shift assignment notification sent to employee ${assignment.employeeId}`);
        } catch (notificationError) {
          console.error('⚠️ Failed to send shift assignment notification:', notificationError);
          // Don't fail the assignment if notification fails
        }
      }

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAssignments(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.orgCode;
      const filters = {
        employeeId: req.query.employeeId,
        shiftId: req.query.shiftId,
        rosterId: req.query.rosterId,
        status: req.query.status,
        hrCode: req.query.hrCode || req.user.hrCode,
        date: req.query.date,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const assignments = await shiftService.getAssignments(organizationId, filters);

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAssignmentById(req, res) {
    try {
      const assignment = await shiftService.getAssignmentById(req.params.id);

      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateAssignment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assignment = await shiftService.updateAssignment(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async confirmAssignment(req, res) {
    try {
      const assignment = await shiftService.confirmAssignment(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Assignment confirmed successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Confirm assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async declineAssignment(req, res) {
    try {
      const assignment = await shiftService.declineAssignment(
        req.params.id,
        req.user.id,
        req.body.reason
      );

      res.json({
        success: true,
        message: 'Assignment declined',
        data: assignment
      });
    } catch (error) {
      console.error('Decline assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async requestSwap(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assignment = await shiftService.requestSwap(
        req.params.id,
        req.user.id,
        req.body.swapWithEmployeeId
      );

      // Send notification to the employee being asked to swap
      if (req.body.swapWithEmployeeId) {
        try {
          await oneSignalService.sendToUser(
            req.body.swapWithEmployeeId.toString(),
            {
              title: '🔄 Shift Swap Request',
              message: `${req.user.name} has requested to swap shifts with you`,
              data: {
                type: 'shift_swap_request',
                assignmentId: assignment.id,
                requestedBy: req.user.id,
                requestedByName: req.user.name,
                shiftId: assignment.shiftId,
                date: assignment.date,
                timestamp: new Date().toISOString()
              }
            }
          );
          console.log(`✅ Shift swap request notification sent to employee ${req.body.swapWithEmployeeId}`);
        } catch (notificationError) {
          console.error('⚠️ Failed to send shift swap request notification:', notificationError);
          // Don't fail the swap request if notification fails
        }
      }

      res.json({
        success: true,
        message: 'Swap request submitted',
        data: assignment
      });
    } catch (error) {
      console.error('Request swap error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async approveSwap(req, res) {
    try {
      await shiftService.approveSwap(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Swap approved successfully'
      });
    } catch (error) {
      console.error('Approve swap error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteAssignment(req, res) {
    try {
      await shiftService.deleteAssignment(req.params.id);

      res.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= SCHEDULE ENDPOINTS =============

  async getMySchedule(req, res) {
    try {
      const startDate = req.query.startDate || new Date();
      const endDate = req.query.endDate ||
        new Date(new Date().setDate(new Date().getDate() + 30));

      const schedule = await shiftService.getEmployeeSchedule(
        req.user.id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Get my schedule error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTeamSchedule(req, res) {
    try {
      const date = req.query.date || new Date();

      const schedule = await shiftService.getTeamSchedule(req.user.id, date);

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Get team schedule error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= BULK ENDPOINTS =============

  async bulkAssignShifts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assignments = req.body.assignments.map(assignment => ({
        ...assignment,
        organizationId: req.user.organizationId || req.user.orgCode,
        hrCode: req.user.hrCode
      }));

      const result = await shiftService.bulkAssignShifts(assignments, req.user.id);

      res.json({
        success: true,
        message: `${result.totalSuccess} assignments created, ${result.totalFailed} failed`,
        data: result
      });
    } catch (error) {
      console.error('Bulk assign error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ShiftController();
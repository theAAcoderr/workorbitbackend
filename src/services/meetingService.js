const { Meeting, MeetingAttendee, MeetingAction, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class MeetingService {
  // Create a new meeting
  async createMeeting(meetingData, creatorId) {
    try {
      // Get creator info
      const creator = await User.findByPk(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      // Ensure we use the creator's UUID-based organizationId, not orgCode
      const meetingDataWithCorrectOrgId = {
        ...meetingData,
        organizationId: creator.organizationId, // Use UUID from creator
        hrCode: creator.hrCode, // Use hrCode from creator
        createdBy: creatorId,
        createdByName: creator.name,
        createdByHrCode: creator.hrCode
      };

      // Create meeting
      const meeting = await Meeting.create(meetingDataWithCorrectOrgId);

      // Add attendees if provided
      if (meetingData.attendees && meetingData.attendees.length > 0) {
        const attendeeRecords = meetingData.attendees.map(attendee => ({
          meetingId: meeting.id,
          ...attendee
        }));

        await MeetingAttendee.bulkCreate(attendeeRecords);
      }

      // Add action items if provided
      if (meetingData.actionItems && meetingData.actionItems.length > 0) {
        const actionRecords = meetingData.actionItems.map(action => ({
          meetingId: meeting.id,
          ...action
        }));

        await MeetingAction.bulkCreate(actionRecords);
      }

      return this.getMeetingById(meeting.id);
    } catch (error) {
      throw new Error(`Failed to create meeting: ${error.message}`);
    }
  }

  // Get meeting by ID with all relations
  async getMeetingById(meetingId, userId = null) {
    try {
      const meeting = await Meeting.findByPk(meetingId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: MeetingAttendee,
            as: 'attendees',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'role', 'department']
              }
            ]
          },
          {
            model: MeetingAction,
            as: 'actionItems',
            include: [
              {
                model: User,
                as: 'assignee',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });

      if (!meeting) {
        return null;
      }

      // If userId provided, check if user has access to this meeting
      if (userId) {
        const hasAccess = await this.checkMeetingAccess(meetingId, userId);
        if (!hasAccess) {
          throw new Error('Access denied to this meeting');
        }
      }

      return meeting;
    } catch (error) {
      throw new Error(`Failed to get meeting: ${error.message}`);
    }
  }

  // Get meetings for a user based on filters
  async getMeetings(userId, filters = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const whereClause = {
        organizationId: user.organizationId // Use UUID only, not orgCode
      };

      // Add HR code filtering if user is HR or Manager
      if ((user.role === 'hr' || user.role === 'manager') && user.hrCode) {
        whereClause.hrCode = user.hrCode;
      }

      // Apply filters
      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.startDate && filters.endDate) {
        whereClause.startTime = {
          [Op.between]: [filters.startDate, filters.endDate]
        };
      } else if (filters.startDate) {
        whereClause.startTime = {
          [Op.gte]: filters.startDate
        };
      } else if (filters.endDate) {
        whereClause.startTime = {
          [Op.lte]: filters.endDate
        };
      }

      if (filters.searchQuery) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${filters.searchQuery}%` } },
          { description: { [Op.iLike]: `%${filters.searchQuery}%` } }
        ];
      }

      // Get meetings where user is creator or attendee
      const meetings = await Meeting.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: MeetingAttendee,
            as: 'attendees',
            required: filters.showOnlyMyMeetings ? true : false,
            where: filters.showOnlyMyMeetings ? { userId } : undefined
          },
          {
            model: MeetingAction,
            as: 'actionItems'
          }
        ],
        order: [['startTime', 'ASC']]
      });

      // If not showing only my meetings, filter to show meetings where user is involved
      let filteredMeetings = meetings;
      if (!filters.showOnlyMyMeetings) {
        filteredMeetings = meetings.filter(meeting => {
          return meeting.createdBy === userId ||
                 meeting.attendees.some(attendee => attendee.userId === userId);
        });
      }

      return filteredMeetings;
    } catch (error) {
      throw new Error(`Failed to get meetings: ${error.message}`);
    }
  }

  // Get upcoming meetings for a user
  async getUpcomingMeetings(userId, days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      return this.getMeetings(userId, {
        startDate,
        endDate,
        status: 'scheduled'
      });
    } catch (error) {
      throw new Error(`Failed to get upcoming meetings: ${error.message}`);
    }
  }

  // Get today's meetings for a user
  async getTodayMeetings(userId) {
    try {
      const startOfDay = moment().startOf('day').toDate();
      const endOfDay = moment().endOf('day').toDate();

      return this.getMeetings(userId, {
        startDate: startOfDay,
        endDate: endOfDay
      });
    } catch (error) {
      throw new Error(`Failed to get today's meetings: ${error.message}`);
    }
  }

  // Update meeting
  async updateMeeting(meetingId, updateData, userId) {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Check if user has permission to update
      const canUpdate = await this.canUserModifyMeeting(meetingId, userId);
      if (!canUpdate) {
        throw new Error('Permission denied to update meeting');
      }

      await meeting.update(updateData);

      return this.getMeetingById(meetingId);
    } catch (error) {
      throw new Error(`Failed to update meeting: ${error.message}`);
    }
  }

  // Update attendee response
  async updateAttendeeResponse(meetingId, userId, status, response = null) {
    try {
      const attendee = await MeetingAttendee.findOne({
        where: { meetingId, userId }
      });

      if (!attendee) {
        throw new Error('Attendee record not found');
      }

      await attendee.update({
        status,
        response,
        respondedAt: new Date()
      });

      return attendee;
    } catch (error) {
      throw new Error(`Failed to update attendee response: ${error.message}`);
    }
  }

  // Mark attendance
  async markAttendance(meetingId, userId, hasJoined = true) {
    try {
      const attendee = await MeetingAttendee.findOne({
        where: { meetingId, userId }
      });

      if (!attendee) {
        throw new Error('Attendee record not found');
      }

      const updateData = {
        hasJoined,
        joinedAt: hasJoined ? new Date() : null
      };

      // If joining, also accept the meeting if status is pending
      if (hasJoined && attendee.status === 'pending') {
        updateData.status = 'accepted';
        updateData.respondedAt = new Date();
      }

      await attendee.update(updateData);

      return attendee;
    } catch (error) {
      throw new Error(`Failed to mark attendance: ${error.message}`);
    }
  }

  // Complete meeting
  async completeMeeting(meetingId, userId, notes, actionItems = []) {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Check if user has permission to complete
      const canComplete = await this.canUserModifyMeeting(meetingId, userId);
      if (!canComplete) {
        throw new Error('Permission denied to complete meeting');
      }

      // Update meeting status
      await meeting.update({
        status: 'completed',
        notes,
        completedAt: new Date()
      });

      // Add action items if provided
      if (actionItems && actionItems.length > 0) {
        const actionRecords = actionItems.map(action => ({
          meetingId: meeting.id,
          ...action
        }));

        await MeetingAction.bulkCreate(actionRecords);
      }

      return this.getMeetingById(meetingId);
    } catch (error) {
      throw new Error(`Failed to complete meeting: ${error.message}`);
    }
  }

  // Cancel meeting
  async cancelMeeting(meetingId, userId, reason = '') {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Check if user has permission to cancel
      const canCancel = await this.canUserModifyMeeting(meetingId, userId);
      if (!canCancel) {
        throw new Error('Permission denied to cancel meeting');
      }

      await meeting.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date()
      });

      return this.getMeetingById(meetingId);
    } catch (error) {
      throw new Error(`Failed to cancel meeting: ${error.message}`);
    }
  }

  // Delete meeting
  async deleteMeeting(meetingId, userId) {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const user = await User.findByPk(userId);

      // Check if user has permission to delete (admin, creator, or HR)
      const canDelete = user.role === 'admin' ||
                       meeting.createdBy === userId ||
                       user.role === 'hr';

      if (!canDelete) {
        throw new Error('Permission denied to delete meeting');
      }

      // Delete related records first
      await MeetingAttendee.destroy({ where: { meetingId } });
      await MeetingAction.destroy({ where: { meetingId } });

      // Delete the meeting
      await meeting.destroy();

      return true;
    } catch (error) {
      throw new Error(`Failed to delete meeting: ${error.message}`);
    }
  }

  // Get meeting statistics for a user
  async getMeetingStats(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const whereClause = {
        organizationId: user.organizationId // Use UUID only, not orgCode
      };

      // Add HR code filtering if user is HR or Manager
      if ((user.role === 'hr' || user.role === 'manager') && user.hrCode) {
        whereClause.hrCode = user.hrCode;
      }

      // Get total meetings
      const total = await Meeting.count({
        where: whereClause,
        include: [
          {
            model: MeetingAttendee,
            as: 'attendees',
            where: { userId },
            required: false
          }
        ]
      });

      // Get upcoming meetings
      const upcoming = await Meeting.count({
        where: {
          ...whereClause,
          status: 'scheduled',
          startTime: { [Op.gt]: new Date() }
        },
        include: [
          {
            model: MeetingAttendee,
            as: 'attendees',
            where: { userId },
            required: false
          }
        ]
      });

      // Get completed meetings
      const completed = await Meeting.count({
        where: {
          ...whereClause,
          status: 'completed'
        },
        include: [
          {
            model: MeetingAttendee,
            as: 'attendees',
            where: { userId },
            required: false
          }
        ]
      });

      // Get meetings created by user
      const myMeetings = await Meeting.count({
        where: {
          ...whereClause,
          createdBy: userId
        }
      });

      return {
        total,
        upcoming,
        completed,
        myMeetings
      };
    } catch (error) {
      throw new Error(`Failed to get meeting stats: ${error.message}`);
    }
  }

  // Helper method to check if user can modify meeting
  async canUserModifyMeeting(meetingId, userId) {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      const user = await User.findByPk(userId);

      if (!meeting || !user) {
        return false;
      }

      // Admin can modify any meeting
      if (user.role === 'admin') {
        return true;
      }

      // Creator can modify their meeting
      if (meeting.createdBy === userId) {
        return true;
      }

      // HR can modify meetings in their org/hr code
      if (user.role === 'hr' &&
          meeting.organizationId === (user.orgCode || user.organizationId) &&
          (!meeting.hrCode || meeting.hrCode === user.hrCode)) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper method to check if user has access to view meeting
  async checkMeetingAccess(meetingId, userId) {
    try {
      const meeting = await Meeting.findByPk(meetingId);
      const user = await User.findByPk(userId);

      if (!meeting || !user) {
        return false;
      }

      // Admin can view any meeting
      if (user.role === 'admin') {
        return true;
      }

      // Check if user is in the same organization
      if (meeting.organizationId !== user.organizationId) {
        return false;
      }

      // Check if user is creator
      if (meeting.createdBy === userId) {
        return true;
      }

      // Check if user is attendee
      const attendee = await MeetingAttendee.findOne({
        where: { meetingId, userId }
      });

      if (attendee) {
        return true;
      }

      // HR can view meetings in their scope
      if (user.role === 'hr' &&
          (!meeting.hrCode || meeting.hrCode === user.hrCode)) {
        return true;
      }

      // For private meetings, only attendees can view
      if (meeting.isPrivate) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new MeetingService();
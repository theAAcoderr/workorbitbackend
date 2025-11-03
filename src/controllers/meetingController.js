const meetingService = require('../services/meetingService');
const { validationResult } = require('express-validator');
const oneSignalService = require('../services/oneSignalService');

class MeetingController {
  // Create a new meeting
  async createMeeting(req, res) {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const meeting = await meetingService.createMeeting(req.body, req.user.id);

      // Send notification to all attendees
      try {
        const meetingDate = new Date(meeting.startTime).toLocaleDateString();
        const meetingTime = new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (meeting.attendees && meeting.attendees.length > 0) {
          for (const attendee of meeting.attendees) {
            // Don't notify the organizer
            if (attendee.userId && attendee.userId !== req.user.id) {
              await oneSignalService.sendToUser(
                attendee.userId.toString(),
                {
                  title: '📅 New Meeting Scheduled',
                  message: `"${meeting.title}" on ${meetingDate} at ${meetingTime}`,
                  data: {
                    type: 'meeting_scheduled',
                    meetingId: meeting.id,
                    title: meeting.title,
                    startTime: meeting.startTime,
                    endTime: meeting.endTime,
                    location: meeting.location,
                    organizer: req.user.name,
                    timestamp: new Date().toISOString()
                  }
                }
              );
            }
          }
          console.log(`✅ Meeting scheduled notifications sent to ${meeting.attendees.length} attendees`);
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send meeting notifications:', notificationError);
        // Don't fail the meeting creation if notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        data: meeting
      });
    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create meeting'
      });
    }
  }

  // Get meetings with filters
  async getMeetings(req, res) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        searchQuery: req.query.search,
        showOnlyMyMeetings: req.query.showOnlyMyMeetings === 'true',
        showPastMeetings: req.query.showPastMeetings === 'true'
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const meetings = await meetingService.getMeetings(req.user.id, filters);

      res.json({
        success: true,
        message: 'Meetings retrieved successfully',
        data: meetings,
        count: meetings.length
      });
    } catch (error) {
      console.error('Get meetings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meetings'
      });
    }
  }

  // Get upcoming meetings
  async getUpcomingMeetings(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const meetings = await meetingService.getUpcomingMeetings(req.user.id, days);

      res.json({
        success: true,
        message: 'Upcoming meetings retrieved successfully',
        data: meetings,
        count: meetings.length
      });
    } catch (error) {
      console.error('Get upcoming meetings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get upcoming meetings'
      });
    }
  }

  // Get today's meetings
  async getTodayMeetings(req, res) {
    try {
      const meetings = await meetingService.getTodayMeetings(req.user.id);

      res.json({
        success: true,
        message: 'Today\'s meetings retrieved successfully',
        data: meetings,
        count: meetings.length
      });
    } catch (error) {
      console.error('Get today\'s meetings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get today\'s meetings'
      });
    }
  }

  // Get meeting by ID
  async getMeetingById(req, res) {
    try {
      const meeting = await meetingService.getMeetingById(req.params.id, req.user.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        message: 'Meeting retrieved successfully',
        data: meeting
      });
    } catch (error) {
      console.error('Get meeting by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meeting'
      });
    }
  }

  // Update meeting
  async updateMeeting(req, res) {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const meeting = await meetingService.updateMeeting(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Meeting updated successfully',
        data: meeting
      });
    } catch (error) {
      console.error('Update meeting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update meeting'
      });
    }
  }

  // Update attendee response
  async updateAttendeeResponse(req, res) {
    try {
      const { status, response } = req.body;

      if (!['accepted', 'declined', 'tentative'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be accepted, declined, or tentative'
        });
      }

      const attendee = await meetingService.updateAttendeeResponse(
        req.params.id,
        req.user.id,
        status,
        response
      );

      res.json({
        success: true,
        message: 'Response updated successfully',
        data: attendee
      });
    } catch (error) {
      console.error('Update attendee response error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update response'
      });
    }
  }

  // Mark attendance
  async markAttendance(req, res) {
    try {
      const { hasJoined = true } = req.body;

      const attendee = await meetingService.markAttendance(
        req.params.id,
        req.user.id,
        hasJoined
      );

      res.json({
        success: true,
        message: hasJoined ? 'Attendance marked successfully' : 'Attendance removed successfully',
        data: attendee
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark attendance'
      });
    }
  }

  // Complete meeting
  async completeMeeting(req, res) {
    try {
      const { notes, actionItems } = req.body;

      if (!notes || notes.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Meeting notes are required to complete a meeting'
        });
      }

      const meeting = await meetingService.completeMeeting(
        req.params.id,
        req.user.id,
        notes.trim(),
        actionItems
      );

      res.json({
        success: true,
        message: 'Meeting completed successfully',
        data: meeting
      });
    } catch (error) {
      console.error('Complete meeting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete meeting'
      });
    }
  }

  // Cancel meeting
  async cancelMeeting(req, res) {
    try {
      const { reason } = req.body;

      const meeting = await meetingService.cancelMeeting(
        req.params.id,
        req.user.id,
        reason || ''
      );

      // Send cancellation notification to all attendees
      try {
        if (meeting.attendees && meeting.attendees.length > 0) {
          const meetingDate = new Date(meeting.startTime).toLocaleDateString();
          const meetingTime = new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          for (const attendee of meeting.attendees) {
            if (attendee.userId && attendee.userId !== req.user.id) {
              await oneSignalService.sendToUser(
                attendee.userId.toString(),
                {
                  title: '❌ Meeting Cancelled',
                  message: `"${meeting.title}" scheduled for ${meetingDate} at ${meetingTime} has been cancelled`,
                  data: {
                    type: 'meeting_cancelled',
                    meetingId: meeting.id,
                    title: meeting.title,
                    startTime: meeting.startTime,
                    cancelledBy: req.user.name,
                    reason: reason || 'No reason provided',
                    timestamp: new Date().toISOString()
                  }
                }
              );
            }
          }
          console.log(`✅ Meeting cancellation notifications sent to ${meeting.attendees.length} attendees`);
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send cancellation notifications:', notificationError);
        // Don't fail the cancellation if notification fails
      }

      res.json({
        success: true,
        message: 'Meeting cancelled successfully',
        data: meeting
      });
    } catch (error) {
      console.error('Cancel meeting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel meeting'
      });
    }
  }

  // Delete meeting
  async deleteMeeting(req, res) {
    try {
      await meetingService.deleteMeeting(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } catch (error) {
      console.error('Delete meeting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete meeting'
      });
    }
  }

  // Get meeting statistics
  async getMeetingStats(req, res) {
    try {
      const stats = await meetingService.getMeetingStats(req.user.id);

      res.json({
        success: true,
        message: 'Meeting statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get meeting stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meeting statistics'
      });
    }
  }

  // Get meeting summary (for completed meetings)
  async getMeetingSummary(req, res) {
    try {
      const meeting = await meetingService.getMeetingById(req.params.id, req.user.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      if (meeting.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Meeting must be completed to view summary'
        });
      }

      // Calculate attendance statistics
      const totalAttendees = meeting.attendees.length;
      const attendedCount = meeting.attendees.filter(a => a.hasJoined).length;
      const acceptedCount = meeting.attendees.filter(a => a.status === 'accepted').length;
      const declinedCount = meeting.attendees.filter(a => a.status === 'declined').length;

      const summary = {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          duration: meeting.endTime - meeting.startTime,
          completedAt: meeting.completedAt
        },
        attendance: {
          total: totalAttendees,
          attended: attendedCount,
          accepted: acceptedCount,
          declined: declinedCount,
          attendanceRate: totalAttendees > 0 ? (attendedCount / totalAttendees * 100).toFixed(1) : 0
        },
        notes: meeting.notes,
        actionItems: meeting.actionItems || [],
        attendees: meeting.attendees.map(a => ({
          id: a.userId,
          name: a.userName,
          email: a.userEmail,
          status: a.status,
          hasJoined: a.hasJoined,
          joinedAt: a.joinedAt
        }))
      };

      res.json({
        success: true,
        message: 'Meeting summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Get meeting summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meeting summary'
      });
    }
  }
}

module.exports = new MeetingController();
const axios = require('axios');
const { logger } = require('../middleware/logger');

/**
 * OneSignal Push Notification Service
 *
 * This service handles all push notifications through OneSignal API
 * Get your credentials from: https://onesignal.com
 */
class OneSignalService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID;
    this.apiKey = process.env.ONESIGNAL_API_KEY;
    this.baseUrl = 'https://onesignal.com/api/v1';

    if (!this.appId || !this.apiKey) {
      logger.warn('OneSignal credentials not configured. Push notifications will not work.');
    }
  }

  /**
   * Send notification to specific user(s)
   */
  async sendToUser(userIds, { title, message, data = {}, url = null }) {
    try {
      if (!this.appId || !this.apiKey) {
        logger.warn('OneSignal not configured. Skipping notification.');
        return { success: false, error: 'OneSignal not configured' };
      }

      const payload = {
        app_id: this.appId,
        include_external_user_ids: Array.isArray(userIds) ? userIds : [userIds],
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          type: data.type || 'general',
          timestamp: new Date().toISOString()
        },
        // Notification settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        priority: 10
      };

      // Add URL if provided
      if (url) {
        payload.url = url;
        payload.web_url = url;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      );

      logger.info('OneSignal notification sent', {
        userIds,
        notificationId: response.data.id,
        recipients: response.data.recipients
      });

      return {
        success: true,
        notificationId: response.data.id,
        recipients: response.data.recipients
      };

    } catch (error) {
      logger.error('OneSignal send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send notification to users with specific tags
   */
  async sendToTags(filters, { title, message, data = {}, url = null }) {
    try {
      if (!this.appId || !this.apiKey) {
        logger.warn('OneSignal not configured. Skipping notification.');
        return { success: false, error: 'OneSignal not configured' };
      }

      const payload = {
        app_id: this.appId,
        filters: filters,
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          type: data.type || 'general',
          timestamp: new Date().toISOString()
        },
        // Notification settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        priority: 10
      };

      // Add URL if provided
      if (url) {
        payload.url = url;
        payload.web_url = url;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      );

      logger.info('OneSignal tag notification sent', {
        filters,
        notificationId: response.data.id
      });

      return {
        success: true,
        notificationId: response.data.id
      };

    } catch (error) {
      logger.error('OneSignal send to tags error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send notification to all users in an organization
   */
  async sendToOrganization(organizationId, { title, message, data = {}, url = null }) {
    const filters = [
      { field: 'tag', key: 'organizationId', relation: '=', value: organizationId.toString() }
    ];

    return this.sendToTags(filters, { title, message, data, url });
  }

  /**
   * Send notification to users with specific role
   */
  async sendToRole(organizationId, role, { title, message, data = {}, url = null }) {
    const filters = [
      { field: 'tag', key: 'organizationId', relation: '=', value: organizationId.toString() },
      { operator: 'AND' },
      { field: 'tag', key: 'role', relation: '=', value: role }
    ];

    return this.sendToTags(filters, { title, message, data, url });
  }

  /**
   * Send notification to all users
   */
  async sendToAll({ title, message, data = {}, url = null }) {
    try {
      if (!this.appId || !this.apiKey) {
        logger.warn('OneSignal not configured. Skipping notification.');
        return { success: false, error: 'OneSignal not configured' };
      }

      const payload = {
        app_id: this.appId,
        included_segments: ['All'],
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          type: data.type || 'general',
          timestamp: new Date().toISOString()
        },
        // Notification settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        priority: 10
      };

      if (url) {
        payload.url = url;
        payload.web_url = url;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      );

      logger.info('OneSignal broadcast sent', {
        notificationId: response.data.id
      });

      return {
        success: true,
        notificationId: response.data.id
      };

    } catch (error) {
      logger.error('OneSignal broadcast error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send scheduled notification
   */
  async scheduleNotification(userIds, { title, message, data = {}, url = null, sendAfter }) {
    try {
      if (!this.appId || !this.apiKey) {
        logger.warn('OneSignal not configured. Skipping notification.');
        return { success: false, error: 'OneSignal not configured' };
      }

      const payload = {
        app_id: this.appId,
        include_external_user_ids: Array.isArray(userIds) ? userIds : [userIds],
        headings: { en: title },
        contents: { en: message },
        data: {
          ...data,
          type: data.type || 'general'
        },
        send_after: sendAfter // ISO 8601 format or timestamp
      };

      if (url) {
        payload.url = url;
        payload.web_url = url;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      );

      logger.info('OneSignal scheduled notification created', {
        notificationId: response.data.id,
        sendAfter
      });

      return {
        success: true,
        notificationId: response.data.id
      };

    } catch (error) {
      logger.error('OneSignal schedule error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      if (!this.appId || !this.apiKey) {
        return { success: false, error: 'OneSignal not configured' };
      }

      await axios.delete(
        `${this.baseUrl}/notifications/${notificationId}?app_id=${this.appId}`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`
          }
        }
      );

      logger.info('OneSignal notification cancelled', { notificationId });
      return { success: true };

    } catch (error) {
      logger.error('OneSignal cancel error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send attendance notification
   */
  async sendAttendanceNotification(userId, { action, employeeName, location }) {
    const titles = {
      'check-in': 'Attendance Check-In',
      'check-out': 'Attendance Check-Out',
      'reminder': 'Attendance Reminder',
      'late': 'Late Check-In Alert'
    };

    const messages = {
      'check-in': `${employeeName} checked in successfully at ${location}`,
      'check-out': `${employeeName} checked out successfully`,
      'reminder': `Hi ${employeeName}, don't forget to check in!`,
      'late': `${employeeName}, you're running late. Please check in.`
    };

    return this.sendToUser(userId, {
      title: titles[action],
      message: messages[action],
      data: {
        type: 'attendance',
        action,
        location
      }
    });
  }

  /**
   * Send leave notification
   */
  async sendLeaveNotification(userId, { status, leaveType, employeeName, dates }) {
    const titles = {
      'requested': 'Leave Request Submitted',
      'approved': 'Leave Request Approved',
      'rejected': 'Leave Request Rejected',
      'cancelled': 'Leave Request Cancelled'
    };

    const messages = {
      'requested': `Your ${leaveType} request for ${dates} has been submitted`,
      'approved': `Your ${leaveType} request for ${dates} has been approved`,
      'rejected': `Your ${leaveType} request for ${dates} has been rejected`,
      'cancelled': `Your ${leaveType} request has been cancelled`
    };

    return this.sendToUser(userId, {
      title: titles[status],
      message: messages[status],
      data: {
        type: 'leave',
        status,
        leaveType,
        dates
      }
    });
  }

  /**
   * Send meeting notification
   */
  async sendMeetingNotification(userIds, { action, title, startTime, location }) {
    const titles = {
      'scheduled': 'Meeting Scheduled',
      'updated': 'Meeting Updated',
      'cancelled': 'Meeting Cancelled',
      'reminder': 'Meeting Reminder',
      'started': 'Meeting Started'
    };

    const messages = {
      'scheduled': `New meeting: ${title} at ${startTime}`,
      'updated': `Meeting updated: ${title}`,
      'cancelled': `Meeting cancelled: ${title}`,
      'reminder': `Meeting starts in 15 minutes: ${title}`,
      'started': `Meeting has started: ${title}`
    };

    return this.sendToUser(userIds, {
      title: titles[action],
      message: messages[action],
      data: {
        type: 'meeting',
        action,
        meetingTitle: title,
        startTime,
        location
      }
    });
  }

  /**
   * Send task notification
   */
  async sendTaskNotification(userId, { action, taskTitle, assignedBy }) {
    const titles = {
      'assigned': 'New Task Assigned',
      'updated': 'Task Updated',
      'completed': 'Task Completed',
      'overdue': 'Task Overdue',
      'comment': 'New Task Comment'
    };

    const messages = {
      'assigned': `${assignedBy} assigned you: ${taskTitle}`,
      'updated': `Task updated: ${taskTitle}`,
      'completed': `Task completed: ${taskTitle}`,
      'overdue': `Task is overdue: ${taskTitle}`,
      'comment': `New comment on: ${taskTitle}`
    };

    return this.sendToUser(userId, {
      title: titles[action],
      message: messages[action],
      data: {
        type: 'task',
        action,
        taskTitle,
        assignedBy
      }
    });
  }

  /**
   * Send payroll notification
   */
  async sendPayrollNotification(userId, { action, month, amount }) {
    const titles = {
      'generated': 'Payroll Generated',
      'payslip': 'Payslip Available'
    };

    const messages = {
      'generated': `Payroll for ${month} has been generated`,
      'payslip': `Your payslip for ${month} is now available${amount ? ` - ₹${amount}` : ''}`
    };

    return this.sendToUser(userId, {
      title: titles[action],
      message: messages[action],
      data: {
        type: 'payroll',
        action,
        month,
        amount
      }
    });
  }
}

module.exports = new OneSignalService();

const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');
const { NotificationPreference } = require('../models');

/**
 * Enhanced Notification Service
 * Sends email, push, and SMS notifications with templates
 */

class NotificationService {
  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const info = await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@workorbit.com',
        to,
        subject,
        html,
        attachments
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed', {
        to,
        subject,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification based on user preferences
   */
  async sendNotification(userId, type, data) {
    try {
      // Get user notification preferences
      const preferences = await NotificationPreference.findOne({
        where: { userId }
      });

      const shouldSendEmail = preferences?.emailNotifications !== false;
      const shouldSendPush = preferences?.pushNotifications !== false;

      const results = {
        email: null,
        push: null,
        sms: null
      };

      // Send email if enabled
      if (shouldSendEmail && data.email) {
        const template = this.getEmailTemplate(type, data);
        results.email = await this.sendEmail(
          data.email.to,
          template.subject,
          template.html
        );
      }

      // Send push notification if enabled
      if (shouldSendPush && data.pushToken) {
        results.push = await this.sendPushNotification(data.pushToken, {
          title: data.title,
          body: data.body,
          data: data.metadata
        });
      }

      return results;
    } catch (error) {
      logger.error('Notification sending failed', {
        userId,
        type,
        error: error.message
      });

      return { error: error.message };
    }
  }

  /**
   * Send push notification (Firebase Cloud Messaging)
   */
  async sendPushNotification(token, notification) {
    // TODO: Implement FCM push notification
    logger.info('Push notification would be sent', { token, notification });
    return { success: true };
  }

  /**
   * Get email template based on notification type
   */
  getEmailTemplate(type, data) {
    const templates = {
      'leave.approved': {
        subject: 'Leave Request Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Leave Request Approved</h2>
            <p>Dear ${data.userName},</p>
            <p>Your leave request has been approved.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Leave Type:</strong> ${data.leaveType}</p>
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>End Date:</strong> ${data.endDate}</p>
              <p><strong>Duration:</strong> ${data.days} days</p>
            </div>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      },
      'leave.rejected': {
        subject: 'Leave Request Rejected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Leave Request Rejected</h2>
            <p>Dear ${data.userName},</p>
            <p>Your leave request has been rejected.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Leave Type:</strong> ${data.leaveType}</p>
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>End Date:</strong> ${data.endDate}</p>
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
            <p>Please contact your manager for more information.</p>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      },
      'task.assigned': {
        subject: 'New Task Assigned',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">New Task Assigned</h2>
            <p>Dear ${data.userName},</p>
            <p>A new task has been assigned to you.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Task:</strong> ${data.taskTitle}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Priority:</strong> ${data.priority}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            <p>${data.description || ''}</p>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      },
      'meeting.invite': {
        subject: 'Meeting Invitation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9C27B0;">Meeting Invitation</h2>
            <p>Dear ${data.userName},</p>
            <p>You have been invited to a meeting.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Date & Time:</strong> ${data.dateTime}</p>
              <p><strong>Location:</strong> ${data.location || 'Virtual'}</p>
              <p><strong>Organizer:</strong> ${data.organizer}</p>
            </div>
            <p>${data.agenda || ''}</p>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      },
      'payslip.generated': {
        subject: 'Payslip Generated',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Payslip Generated</h2>
            <p>Dear ${data.userName},</p>
            <p>Your payslip for ${data.month} has been generated.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Month:</strong> ${data.month}</p>
              <p><strong>Gross Salary:</strong> ₹${data.grossSalary}</p>
              <p><strong>Net Salary:</strong> ₹${data.netSalary}</p>
            </div>
            <p>You can download your payslip from the WorkOrbit app.</p>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      },
      'welcome': {
        subject: 'Welcome to WorkOrbit',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6B8EFF;">Welcome to WorkOrbit!</h2>
            <p>Dear ${data.userName},</p>
            <p>Welcome to ${data.organizationName}. We're excited to have you on board!</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: ${data.email}</p>
              <p>Temporary Password: ${data.temporaryPassword}</p>
              <p style="color: #f44336; font-size: 12px;">Please change your password after first login.</p>
            </div>
            <p>Download the WorkOrbit mobile app to get started.</p>
            <p>Best regards,<br>WorkOrbit Team</p>
          </div>
        `
      }
    };

    return templates[type] || {
      subject: data.subject || 'Notification',
      html: data.html || `<p>${data.message}</p>`
    };
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(users, type, dataTemplate) {
    const results = [];

    for (const user of users) {
      const data = {
        ...dataTemplate,
        userName: user.name,
        email: { to: user.email }
      };

      const result = await this.sendNotification(user.id, type, data);
      results.push({ userId: user.id, ...result });
    }

    return results;
  }

  /**
   * Send scheduled notifications
   */
  async sendScheduledNotifications() {
    // TODO: Implement scheduled notification logic
    // Check for upcoming meetings, pending tasks, etc.
    logger.info('Checking for scheduled notifications...');
  }
}

module.exports = new NotificationService();


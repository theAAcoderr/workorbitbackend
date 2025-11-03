const axios = require('axios');
const logger = require('../middleware/logger');
const crypto = require('crypto');

/**
 * Webhook Service
 * Sends event notifications to external systems
 */

class WebhookService {
  /**
   * Send webhook notification
   */
  static async sendWebhook(url, event, data, secret = null) {
    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'WorkOrbit-Webhook/1.0'
      };

      // Add signature if secret is provided
      if (secret) {
        const signature = this.generateSignature(JSON.stringify(payload), secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(url, payload, {
        headers,
        timeout: 10000 // 10 seconds
      });

      logger.info('Webhook sent successfully', {
        url,
        event,
        status: response.status
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      logger.error('Webhook failed', {
        url,
        event,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate HMAC signature for webhook
   */
  static generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Send employee event webhook
   */
  static async notifyEmployeeEvent(event, employeeData, organizationWebhooks) {
    const webhooks = organizationWebhooks.filter(w => 
      w.events.includes('employee.*') || w.events.includes(`employee.${event}`)
    );

    const results = await Promise.allSettled(
      webhooks.map(webhook => 
        this.sendWebhook(webhook.url, `employee.${event}`, employeeData, webhook.secret)
      )
    );

    return results;
  }

  /**
   * Send attendance event webhook
   */
  static async notifyAttendanceEvent(event, attendanceData, organizationWebhooks) {
    const webhooks = organizationWebhooks.filter(w => 
      w.events.includes('attendance.*') || w.events.includes(`attendance.${event}`)
    );

    const results = await Promise.allSettled(
      webhooks.map(webhook => 
        this.sendWebhook(webhook.url, `attendance.${event}`, attendanceData, webhook.secret)
      )
    );

    return results;
  }

  /**
   * Send leave event webhook
   */
  static async notifyLeaveEvent(event, leaveData, organizationWebhooks) {
    const webhooks = organizationWebhooks.filter(w => 
      w.events.includes('leave.*') || w.events.includes(`leave.${event}`)
    );

    const results = await Promise.allSettled(
      webhooks.map(webhook => 
        this.sendWebhook(webhook.url, `leave.${event}`, leaveData, webhook.secret)
      )
    );

    return results;
  }

  /**
   * Send payroll event webhook
   */
  static async notifyPayrollEvent(event, payrollData, organizationWebhooks) {
    const webhooks = organizationWebhooks.filter(w => 
      w.events.includes('payroll.*') || w.events.includes(`payroll.${event}`)
    );

    const results = await Promise.allSettled(
      webhooks.map(webhook => 
        this.sendWebhook(webhook.url, `payroll.${event}`, payrollData, webhook.secret)
      )
    );

    return results;
  }

  /**
   * Retry failed webhook
   */
  static async retryWebhook(webhookLog) {
    const { url, event, data, secret } = webhookLog;
    return this.sendWebhook(url, event, data, secret);
  }
}

module.exports = WebhookService;


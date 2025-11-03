const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  // Send password reset OTP email
  async sendPasswordResetOTP(data) {
    try {
      const { email, name, otpCode } = data;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'WorkOrbit Support',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Password Reset Code - WorkOrbit',
        html: this.generatePasswordResetOTPTemplate(name, otpCode)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate password reset OTP email template
  generatePasswordResetOTPTemplate(name, otpCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
          .otp-code { display: inline-block; padding: 15px 30px; background: #f0f0f0; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #333; border: 2px dashed #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Code</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>

            <p>We received a request to reset your password for your WorkOrbit account. Please use the following code to reset your password:</p>

            <div style="text-align: center;">
              <div class="otp-code">${otpCode}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> This code will expire in 15 minutes for security reasons.
            </div>

            <p><strong>How to use this code:</strong></p>
            <ol>
              <li>Open the WorkOrbit app</li>
              <li>Go to the password reset screen</li>
              <li>Enter this 6-digit code</li>
              <li>Create your new password</li>
            </ol>

            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

            <div class="footer">
              <p>Best regards,<br>The WorkOrbit Team</p>
              <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send password reset email (legacy - keeping for reference)
  async sendPasswordResetEmail(data) {
    try {
      const { email, name, resetUrl } = data;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'WorkOrbit Support',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Password Reset Request - WorkOrbit',
        html: this.generatePasswordResetTemplate(name, resetUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate password reset email template
  generatePasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>

            <p>We received a request to reset your password for your WorkOrbit account. If you made this request, please click the button below to reset your password:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>

            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

            <div class="footer">
              <p>Best regards,<br>The WorkOrbit Team</p>
              <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send application confirmation email
  async sendApplicationConfirmation(applicationData) {
    try {
      const { candidateInfo, jobTitle, company, trackingCode, securityPin } = applicationData;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'WorkOrbit Recruitment',
          address: process.env.EMAIL_USER
        },
        to: candidateInfo.email,
        subject: `Application Confirmation - ${jobTitle} at ${company}`,
        html: this.generateApplicationConfirmationTemplate(applicationData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Application confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending application confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send status update email
  async sendStatusUpdate(applicationData, newStatus, remarks = '') {
    try {
      const { candidateInfo, jobTitle, company, trackingCode } = applicationData;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'WorkOrbit Recruitment',
          address: process.env.EMAIL_USER
        },
        to: candidateInfo.email,
        subject: `Application Status Update - ${jobTitle} at ${company}`,
        html: this.generateStatusUpdateTemplate(applicationData, newStatus, remarks)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending status update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate application confirmation email template
  generateApplicationConfirmationTemplate(applicationData) {
    const { candidateInfo, jobTitle, company, trackingCode, securityPin, appliedAt } = applicationData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Confirmation</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2E7D32, #4CAF50);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -20px -20px 20px -20px;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 0 20px; }
          .highlight-box {
            background-color: #e8f5e8;
            border-left: 4px solid #2E7D32;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .tracking-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px dashed #2E7D32;
          }
          .tracking-info h3 {
            color: #2E7D32;
            margin-top: 0;
            font-size: 18px;
          }
          .tracking-code {
            font-size: 24px;
            font-weight: bold;
            color: #2E7D32;
            background-color: #ffffff;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin: 10px 0;
            border: 1px solid #2E7D32;
          }
          .security-pin {
            font-size: 20px;
            font-weight: bold;
            color: #FF6B35;
            background-color: #ffffff;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            margin: 10px 0;
            border: 1px solid #FF6B35;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2E7D32;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
          }
          .job-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .job-details h4 {
            color: #2E7D32;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Application Received!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your interest in joining our team</p>
          </div>

          <div class="content">
            <div class="highlight-box">
              <h2 style="color: #2E7D32; margin-top: 0;">Dear ${candidateInfo.name},</h2>
              <p>We have successfully received your application for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
              <p>Your application is now under review by our recruitment team.</p>
            </div>

            <div class="job-details">
              <h4>📋 Application Details</h4>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Applied on:</strong> ${new Date(appliedAt || new Date()).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Email:</strong> ${candidateInfo.email}</p>
              <p><strong>Phone:</strong> ${candidateInfo.phone}</p>
            </div>

            <div class="tracking-info">
              <h3>📍 Track Your Application</h3>
              <p>Use these credentials to track the status of your application at any time:</p>

              <div>
                <strong>Tracking Code:</strong>
                <div class="tracking-code">${trackingCode}</div>
              </div>

              <div>
                <strong>Security PIN:</strong>
                <div class="security-pin">${securityPin}</div>
              </div>

              <p style="margin-top: 15px; font-size: 14px; color: #666;">
                <strong>Important:</strong> Keep these credentials safe and confidential. You will need both to track your application status.
              </p>
            </div>

            <div class="highlight-box">
              <h3 style="color: #2E7D32; margin-top: 0;">🚀 What's Next?</h3>
              <ul style="padding-left: 20px;">
                <li>Our recruitment team will review your application</li>
                <li>If shortlisted, we will contact you within 5-7 business days</li>
                <li>You can track your application status using the credentials above</li>
                <li>We'll keep you updated via email on any status changes</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-application" class="button">
                🔍 Track Application Status
              </a>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>💡 Tip:</strong> Add our email address (${process.env.EMAIL_USER}) to your contacts to ensure you receive all updates about your application.
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>WorkOrbit Recruitment Team</strong></p>
            <p>📧 ${process.env.EMAIL_USER}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated email. Please do not reply to this message.<br>
              If you have any questions, please contact our recruitment team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate status update email template
  generateStatusUpdateTemplate(applicationData, newStatus, remarks) {
    const { candidateInfo, jobTitle, company, trackingCode } = applicationData;

    const statusEmojis = {
      'Applied': '📝',
      'Screening': '👀',
      'Interview': '🤝',
      'Selected': '🎉',
      'Rejected': '❌',
      'On Hold': '⏸️'
    };

    const statusColors = {
      'Applied': '#2196F3',
      'Screening': '#FF9800',
      'Interview': '#9C27B0',
      'Selected': '#4CAF50',
      'Rejected': '#F44336',
      'On Hold': '#607D8B'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, ${statusColors[newStatus] || '#2E7D32'}, ${statusColors[newStatus] || '#4CAF50'});
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -20px -20px 20px -20px;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .status-badge {
            display: inline-block;
            padding: 10px 20px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 20px;
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          .content { padding: 0 20px; }
          .highlight-box {
            background-color: #e8f5e8;
            border-left: 4px solid ${statusColors[newStatus] || '#2E7D32'};
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .tracking-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
          }
          .tracking-code {
            font-size: 20px;
            font-weight: bold;
            color: #2E7D32;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            margin-top: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${statusColors[newStatus] || '#2E7D32'};
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusEmojis[newStatus] || '📋'} Status Update</h1>
            <div class="status-badge">${newStatus}</div>
          </div>

          <div class="content">
            <div class="highlight-box">
              <h2 style="color: ${statusColors[newStatus] || '#2E7D32'}; margin-top: 0;">Dear ${candidateInfo.name},</h2>
              <p>We have an update regarding your application for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
              <p><strong>Your application status has been updated to: ${newStatus}</strong></p>
              ${remarks ? `<p><strong>Additional Information:</strong> ${remarks}</p>` : ''}
            </div>

            <div class="tracking-info">
              <p><strong>Track your application with:</strong></p>
              <div class="tracking-code">Tracking Code: ${trackingCode}</div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-application" class="button">
                🔍 View Full Application Status
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>WorkOrbit Recruitment Team</strong></p>
            <p>📧 ${process.env.EMAIL_USER}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send custom notification email
  async sendCustomNotification(to, subject, message, applicationData = null) {
    try {
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'WorkOrbit Recruitment',
          address: process.env.EMAIL_USER
        },
        to: to,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .footer { text-align: center; padding: 15px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>WorkOrbit Recruitment</h1>
              </div>
              <div class="content">
                ${message}
                ${applicationData ? `
                  <hr>
                  <p><strong>Application Details:</strong></p>
                  <p>Position: ${applicationData.jobTitle}</p>
                  <p>Company: ${applicationData.company}</p>
                  <p>Tracking Code: ${applicationData.trackingCode}</p>
                ` : ''}
              </div>
              <div class="footer">
                <p>WorkOrbit Recruitment Team</p>
                <p>${process.env.EMAIL_USER}</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Custom notification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending custom notification email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
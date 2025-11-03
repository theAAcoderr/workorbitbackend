# Email Service - README

## Overview

The WorkOrbit email service provides reliable email delivery with graceful degradation. It works seamlessly whether email is configured or not, ensuring your application never crashes due to email issues.

## Features

✅ **Graceful Degradation** - Works without email configuration
✅ **Multiple Providers** - Supports Gmail, SendGrid, Amazon SES, and more
✅ **Smart Timeouts** - Optimized for cloud environments
✅ **Connection Pooling** - Efficient for high volume
✅ **Comprehensive Logging** - Easy debugging
✅ **Production Ready** - Handles all edge cases

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Service Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Configuration Detection                            │  │
│  │  - Checks EMAIL_USER & EMAIL_PASSWORD              │  │
│  │  - Sets isConfigured flag                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│           ┌──────────────┴──────────────┐                  │
│           │                             │                  │
│     Configured ✅                  Not Configured ⚠️       │
│           │                             │                  │
│  ┌────────▼────────┐          ┌─────────▼─────────┐       │
│  │ SMTP Transport  │          │  Log-Only Mode    │       │
│  ├─────────────────┤          ├───────────────────┤       │
│  │ • Pool: 5 conn  │          │ • Logs to console │       │
│  │ • Timeout: 15s  │          │ • Returns success │       │
│  │ • Retry: 2x     │          │ • Never crashes   │       │
│  │ • Rate limit: 5 │          │ • Debug friendly  │       │
│  └────────┬────────┘          └─────────┬─────────┘       │
│           │                             │                  │
│           └──────────────┬──────────────┘                  │
│                          │                                  │
│                ┌─────────▼─────────┐                       │
│                │   Email Methods   │                       │
│                ├───────────────────┤                       │
│                │ • Password Reset  │                       │
│                │ • Application     │                       │
│                │ • Status Update   │                       │
│                │ • Custom Notice   │                       │
│                └───────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. No Configuration (Development)

Don't set EMAIL_USER or EMAIL_PASSWORD. Emails will be logged to console.

```bash
npm start
```

**Output**:
```
⚠️  Email service not configured - emails will be logged but not sent
📧 EMAIL LOG (not sent - service not configured)
Type: Password Reset OTP
Recipient: user@example.com
```

### 2. With Configuration (Production)

Set environment variables and emails will be sent.

```bash
# .env or Render dashboard
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_NAME=WorkOrbit
```

**Output**:
```
✅ Email service initialized successfully
✅ Email service is ready to send emails
✅ Password reset OTP email sent: <message-id>
```

## Testing

### Test Email Service

```bash
npm run email:test
```

This tests:
- Configuration check
- Connection test
- Password reset OTP
- Application confirmation
- Status updates
- Custom notifications

### Test Without Configuration

```bash
npm run email:test:no-config
```

This verifies graceful degradation works correctly.

## Email Providers

### SendGrid (Recommended)

**Best for**: Production, better deliverability
**Free tier**: 100 emails/day
**Setup**: https://sendgrid.com

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Gmail (Testing)

**Best for**: Local testing, development
**Limit**: 500 emails/day
**Note**: Requires app password

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

### Amazon SES (High Volume)

**Best for**: Large scale production
**Cost**: $0.10 per 1000 emails
**Setup**: AWS SES Console

```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
```

## Usage in Code

### Send Password Reset OTP

```javascript
const emailService = require('./services/emailService');

const result = await emailService.sendPasswordResetOTP({
  email: 'user@example.com',
  name: 'John Doe',
  otpCode: '123456'
});

console.log(result);
// With config: { success: true, messageId: '<abc123>' }
// Without config: { success: true, messageId: 'logged-only', note: 'Email service not configured' }
```

### Send Application Confirmation

```javascript
const result = await emailService.sendApplicationConfirmation({
  candidateInfo: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1234567890'
  },
  jobTitle: 'Senior Developer',
  company: 'TechCorp',
  trackingCode: 'ABC123',
  securityPin: '9876',
  appliedAt: new Date()
});
```

### Send Status Update

```javascript
const result = await emailService.sendStatusUpdate(
  {
    candidateInfo: { name: 'John', email: 'john@example.com' },
    jobTitle: 'Developer',
    company: 'TechCorp',
    trackingCode: 'ABC123'
  },
  'Interview',
  'Please check your email for interview details.'
);
```

### Send Custom Notification

```javascript
const result = await emailService.sendCustomNotification(
  'user@example.com',
  'Important Update',
  '<h2>Your Update</h2><p>Details here...</p>'
);
```

## Error Handling

The email service never throws errors. It always returns a result object:

### Success
```javascript
{
  success: true,
  messageId: '<abc123@example.com>'
}
```

### Not Configured (still succeeds)
```javascript
{
  success: true,
  messageId: 'logged-only',
  note: 'Email service not configured'
}
```

### Failed to Send
```javascript
{
  success: false,
  error: 'Connection timeout',
  note: 'Operation completed but email failed'
}
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| EMAIL_HOST | No | smtp.gmail.com | SMTP server hostname |
| EMAIL_PORT | No | 587 | SMTP port (587, 465, 2525) |
| EMAIL_USER | No | - | SMTP username |
| EMAIL_PASSWORD | No | - | SMTP password |
| EMAIL_FROM_NAME | No | WorkOrbit Support | Sender name |

### SMTP Configuration

The service uses these settings for optimal performance:

```javascript
{
  pool: true,                // Enable connection pooling
  maxConnections: 5,         // Max concurrent connections
  maxMessages: 100,          // Messages per connection
  rateDelta: 1000,           // Rate limit window (ms)
  rateLimit: 5,              // Max messages per window
  connectionTimeout: 10000,  // 10 seconds
  greetingTimeout: 10000,    // 10 seconds
  socketTimeout: 15000,      // 15 seconds
  retry: {
    maxRetries: 2,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000
  }
}
```

## Troubleshooting

### Email not configured warning

**Message**: `⚠️ Email service not configured`

**Solution**: This is normal if EMAIL_USER and EMAIL_PASSWORD are not set. Emails will be logged to console. To enable sending, set the environment variables.

### Connection timeout

**Message**: `❌ Email service connection failed: Connection timeout`

**Solutions**:
1. Use SendGrid instead of Gmail (better for cloud hosting)
2. Check if SMTP port is blocked by firewall
3. Try alternative port (2525 instead of 587)
4. Verify network connectivity

### Authentication failed

**Message**: `❌ Error sending email: Authentication failed`

**Solutions**:
1. Gmail: Use app password, not regular password
2. SendGrid: Use "apikey" as username (literal string)
3. Check for typos in credentials
4. Verify environment variables are set correctly

### Emails going to spam

**Solutions**:
1. Use SendGrid with verified domain
2. Set up SPF and DKIM records
3. Avoid spam trigger words
4. Use professional email templates

## Monitoring

### Startup Messages

**Configured and working**:
```
✅ Email service initialized successfully
✅ Email service is ready to send emails
```

**Not configured (development)**:
```
⚠️  Email service not configured - emails will be logged but not sent
```

**Configuration error**:
```
❌ Failed to initialize email service: [error message]
⚠️  Emails will be logged but not sent
```

### Runtime Messages

**Email sent successfully**:
```
✅ Password reset OTP email sent: <message-id>
✅ Application confirmation email sent: <message-id>
```

**Email failed but operation continued**:
```
❌ Error sending password reset email: Connection timeout
📧 EMAIL LOG (not sent - service not configured)
```

## Files

| File | Purpose |
|------|---------|
| [src/services/emailService.js](src/services/emailService.js) | Main email service |
| [test-email-service.js](test-email-service.js) | Test script |
| [test-email-no-config.js](test-email-no-config.js) | Graceful degradation test |
| [.env.example](.env.example) | Configuration template |

## Documentation

| Document | Description |
|----------|-------------|
| [EMAIL_SERVICE_FIX_GUIDE.md](../../EMAIL_SERVICE_FIX_GUIDE.md) | Complete setup guide |
| [EMAIL_SERVICE_FIX_SUMMARY.md](../../EMAIL_SERVICE_FIX_SUMMARY.md) | Technical summary |
| [EMAIL_SERVICE_QUICK_REFERENCE.md](../../EMAIL_SERVICE_QUICK_REFERENCE.md) | Quick reference |
| [SMTP_TIMEOUT_FIX_COMPLETE.md](../../SMTP_TIMEOUT_FIX_COMPLETE.md) | Complete fix report |

## Best Practices

### Development
- Don't configure email - use log-only mode
- Test with `npm run email:test`
- Check console logs for email attempts

### Staging
- Use Gmail with app password
- Monitor email delivery
- Test all email types

### Production
- Use SendGrid or Amazon SES
- Set up proper SPF/DKIM records
- Monitor delivery rates
- Set up webhooks for tracking

## Support

Having issues?

1. Run `npm run email:test` to diagnose
2. Check server logs for email messages
3. Review [EMAIL_SERVICE_FIX_GUIDE.md](../../EMAIL_SERVICE_FIX_GUIDE.md)
4. Email attempts are always logged for debugging

---

**Remember**: The application works perfectly without email configuration! 🎉

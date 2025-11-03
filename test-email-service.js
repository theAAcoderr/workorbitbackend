/**
 * Email Service Test Script
 *
 * This script tests the email service to verify it's working correctly
 * and handles errors gracefully.
 */

require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmailService() {
  console.log('\n🧪 Testing Email Service');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Check if email service is configured
  console.log('📋 Test 1: Configuration Check');
  console.log('─────────────────────────────────────');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com (default)');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '587 (default)');
  console.log('Service Status:', emailService.isConfigured ? '✅ Configured' : '⚠️  Not configured (log-only mode)');
  console.log('\n');

  // Test 2: Test connection
  console.log('📋 Test 2: Connection Test');
  console.log('─────────────────────────────────────');
  const connectionResult = await emailService.testConnection();
  console.log('Connection Result:', connectionResult ? '✅ Connected' : '❌ Failed (expected if not configured)');
  console.log('\n');

  // Test 3: Send Password Reset OTP Email
  console.log('📋 Test 3: Password Reset OTP Email');
  console.log('─────────────────────────────────────');
  const otpResult = await emailService.sendPasswordResetOTP({
    email: 'test@example.com',
    name: 'Test User',
    otpCode: '123456'
  });
  console.log('Result:', JSON.stringify(otpResult, null, 2));
  console.log('\n');

  // Test 4: Send Application Confirmation Email
  console.log('📋 Test 4: Application Confirmation Email');
  console.log('─────────────────────────────────────');
  const confirmationResult = await emailService.sendApplicationConfirmation({
    candidateInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    },
    jobTitle: 'Senior Developer',
    company: 'TechCorp',
    trackingCode: 'ABC123',
    securityPin: '9876',
    appliedAt: new Date()
  });
  console.log('Result:', JSON.stringify(confirmationResult, null, 2));
  console.log('\n');

  // Test 5: Send Status Update Email
  console.log('📋 Test 5: Status Update Email');
  console.log('─────────────────────────────────────');
  const statusResult = await emailService.sendStatusUpdate(
    {
      candidateInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      jobTitle: 'Senior Developer',
      company: 'TechCorp',
      trackingCode: 'ABC123'
    },
    'Interview',
    'Please check your email for interview details.'
  );
  console.log('Result:', JSON.stringify(statusResult, null, 2));
  console.log('\n');

  // Test 6: Send Custom Notification
  console.log('📋 Test 6: Custom Notification Email');
  console.log('─────────────────────────────────────');
  const customResult = await emailService.sendCustomNotification(
    'test@example.com',
    'Test Notification',
    '<h2>This is a test notification</h2><p>Testing the email service.</p>'
  );
  console.log('Result:', JSON.stringify(customResult, null, 2));
  console.log('\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Email Service Test Complete!\n');

  if (!emailService.isConfigured) {
    console.log('⚠️  NOTE: Email service is not configured.');
    console.log('   All emails are being logged to console instead of sent.');
    console.log('   To enable email sending, set these environment variables:');
    console.log('   - EMAIL_USER=your-email@gmail.com');
    console.log('   - EMAIL_PASSWORD=your-app-password');
    console.log('   See EMAIL_SERVICE_FIX_GUIDE.md for setup instructions.\n');
  } else {
    if (connectionResult) {
      console.log('✅ Email service is configured and working!');
      console.log('   Check the email logs above to see if emails were sent.\n');
    } else {
      console.log('⚠️  Email service is configured but connection failed.');
      console.log('   Check your email credentials and network connection.');
      console.log('   The service will log emails instead of sending them.\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test
testEmailService()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });

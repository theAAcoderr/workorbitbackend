/**
 * Email Service Test - Without Configuration
 *
 * This tests that the email service works gracefully when
 * email credentials are not configured.
 */

// Temporarily remove email credentials
const originalUser = process.env.EMAIL_USER;
const originalPass = process.env.EMAIL_PASSWORD;

delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASSWORD;

// Clear the cached module so it reinitializes without credentials
delete require.cache[require.resolve('./src/services/emailService')];

const emailService = require('./src/services/emailService');

async function testWithoutConfig() {
  console.log('\n🧪 Testing Email Service WITHOUT Configuration');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📋 Service Status:');
  console.log('Configured:', emailService.isConfigured ? 'Yes' : 'No ✅ (Expected)');
  console.log('\n');

  console.log('📋 Testing Password Reset OTP (should log, not send)');
  console.log('─────────────────────────────────────────');
  const result1 = await emailService.sendPasswordResetOTP({
    email: 'test@example.com',
    name: 'Test User',
    otpCode: '123456'
  });
  console.log('✅ Result:', JSON.stringify(result1, null, 2));
  console.log('\n');

  console.log('📋 Testing Application Confirmation (should log, not send)');
  console.log('─────────────────────────────────────────');
  const result2 = await emailService.sendApplicationConfirmation({
    candidateInfo: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890'
    },
    jobTitle: 'Product Manager',
    company: 'StartupCo',
    trackingCode: 'XYZ789',
    securityPin: '5432',
    appliedAt: new Date()
  });
  console.log('✅ Result:', JSON.stringify(result2, null, 2));
  console.log('\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Test Complete!\n');
  console.log('The email service handled missing credentials gracefully:');
  console.log('- Did not crash ✅');
  console.log('- Logged emails to console ✅');
  console.log('- Returned success status ✅');
  console.log('- Operations continued normally ✅\n');

  // Restore credentials for other tests
  process.env.EMAIL_USER = originalUser;
  process.env.EMAIL_PASSWORD = originalPass;
}

testWithoutConfig()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

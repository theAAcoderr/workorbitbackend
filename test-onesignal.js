/**
 * Quick OneSignal Notification Test
 * Run this to test your OneSignal configuration
 */

require('dotenv').config();
const https = require('https');

// Your configuration from .env
const APP_ID = process.env.ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_API_KEY;

console.log('\n🔔 OneSignal Notification Test\n');
console.log('━'.repeat(50));
console.log('App ID:', APP_ID);
console.log('API Key:', API_KEY ? API_KEY.slice(0, 20) + '...' : 'NOT SET');
console.log('━'.repeat(50) + '\n');

if (!APP_ID || !API_KEY) {
  console.error('❌ Error: OneSignal credentials not configured!');
  console.log('\nPlease set these in your .env file:');
  console.log('  ONESIGNAL_APP_ID=your_app_id');
  console.log('  ONESIGNAL_API_KEY=your_api_key\n');
  process.exit(1);
}

// Send test notification to all subscribed users
async function sendTestNotification() {
  console.log('📤 Sending test notification to all subscribers...\n');

  const notification = {
    app_id: APP_ID,
    included_segments: ['All'],
    headings: { en: 'Test from WorkOrbit Backend' },
    contents: { en: 'Your OneSignal push notifications are working perfectly!' },
    data: {
      type: 'test',
      message: 'This is a test notification',
      timestamp: new Date().toISOString()
    }
  };

  const data = JSON.stringify(notification);

  const options = {
    hostname: 'onesignal.com',
    path: '/api/v1/notifications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${API_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);

          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(result, null, 2)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

// Run the test
sendTestNotification()
  .then(result => {
    console.log('✅ Success! Notification sent successfully!\n');
    console.log('━'.repeat(50));
    console.log('Response Details:');
    console.log('━'.repeat(50));
    console.log('Notification ID:', result.id);
    console.log('Recipients:', result.recipients || 0);

    if (result.errors) {
      console.log('Errors:', result.errors);
    }

    console.log('━'.repeat(50) + '\n');

    if (result.recipients === 0 || !result.recipients) {
      console.log('⚠️  Note: No devices are subscribed yet.');
      console.log('\n📱 To receive notifications on your device:\n');
      console.log('1. Install your Flutter app on a device/emulator');
      console.log('2. Add OneSignal to your Flutter app:');
      console.log('   flutter pub add onesignal_flutter');
      console.log('3. Initialize OneSignal in main.dart:');
      console.log('   OneSignal.initialize("' + APP_ID + '");');
      console.log('4. Request notification permission');
      console.log('5. Run the app and grant permission');
      console.log('6. Run this test again!\n');
      console.log('✅ Your OneSignal API connection is working correctly!');
      console.log('   Once you connect a device, it will receive notifications.\n');
    } else {
      console.log('🎉 Notification delivered to', result.recipients, 'device(s)!\n');
      console.log('Check your device for the notification! 📱\n');
    }
  })
  .catch(error => {
    console.error('❌ Error sending notification:\n');
    console.error(error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your App ID and API Key in .env file');
    console.log('2. Verify credentials at: https://onesignal.com');
    console.log('3. Go to Settings → Keys & IDs');
    console.log('4. Make sure you copied the correct values\n');
    process.exit(1);
  });

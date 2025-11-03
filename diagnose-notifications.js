require('dotenv').config();
const { User } = require('./src/models');

async function diagnose() {
  console.log('\n🔍 NOTIFICATION DIAGNOSTIC\n');
  console.log('='.repeat(60));

  // 1. Check OneSignal Configuration
  console.log('\n1️⃣ CHECKING ONESIGNAL CONFIGURATION:');
  console.log('─'.repeat(60));
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || appId === 'your_onesignal_app_id_here') {
    console.log('❌ ONESIGNAL_APP_ID not configured in .env');
    console.log('   Current value:', appId);
    process.exit(1);
  } else {
    console.log('✅ ONESIGNAL_APP_ID:', appId);
  }

  if (!apiKey || apiKey === 'your_onesignal_rest_api_key_here') {
    console.log('❌ ONESIGNAL_API_KEY not configured in .env');
    process.exit(1);
  } else {
    console.log('✅ ONESIGNAL_API_KEY:', apiKey.substring(0, 20) + '...');
  }

  // 2. Check Admin Users
  console.log('\n2️⃣ CHECKING ADMIN USERS:');
  console.log('─'.repeat(60));

  try {
    const admins = await User.findAll({
      where: {
        role: ['admin', 'hr'],
        status: 'active'
      },
      attributes: ['id', 'name', 'email', 'role', 'organizationId', 'oneSignalPlayerId'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    if (admins.length === 0) {
      console.log('❌ NO ADMIN/HR USERS FOUND');
      console.log('\n   Please create an admin user first.');
      process.exit(1);
    }

    console.log(`✅ Found ${admins.length} admin/HR user(s):\n`);

    let usersWithPlayerId = 0;
    let usersWithoutPlayerId = 0;

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.role})`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   User ID: ${admin.id}`);
      console.log(`   Org ID: ${admin.organizationId}`);

      if (!admin.oneSignalPlayerId) {
        console.log(`   ❌ OneSignal Player ID: NOT SET`);
        console.log(`   ⚠️  User must log into mobile app!`);
        usersWithoutPlayerId++;
      } else {
        console.log(`   ✅ OneSignal Player ID: ${admin.oneSignalPlayerId}`);
        usersWithPlayerId++;
      }
      console.log('');
    });

    // 3. Check if notifications can be sent
    console.log('3️⃣ NOTIFICATION STATUS:');
    console.log('─'.repeat(60));

    if (usersWithoutPlayerId > 0) {
      console.log(`❌ ISSUE: ${usersWithoutPlayerId} admin user(s) without OneSignal Player ID`);
      console.log('\n📝 TO FIX:');
      console.log('1. Open mobile app');
      console.log('2. Log in as admin user');
      console.log('3. Wait 5 seconds for OneSignal registration');
      console.log('4. Check logs for "OneSignal Player ID: xxx"');
      console.log('5. Run this script again\n');
    } else {
      console.log('✅ ALL ADMIN USERS REGISTERED');
      console.log('\n📝 READY TO TEST:');
      console.log('1. Keep mobile app open');
      console.log('2. Create expense > ₹10,000');
      console.log('3. Check for notification popup\n');

      if (admins[0]) {
        console.log('TEST COMMAND:');
        console.log(`node src/scripts/test-admin-notifications.js ${admins[0].organizationId}\n`);
      }
    }

    // 4. Summary
    console.log('='.repeat(60));
    console.log('\n📊 SUMMARY:\n');
    console.log(`Total admin users: ${admins.length}`);
    console.log(`✅ Registered with OneSignal: ${usersWithPlayerId}`);
    console.log(`❌ Not registered: ${usersWithoutPlayerId}`);

    if (usersWithoutPlayerId === 0) {
      console.log('\n✅ NOTIFICATIONS SHOULD WORK!');
      console.log('\nIf still not receiving notifications, check:');
      console.log('1. Mobile app permissions (Settings → WorkOrbit → Notifications)');
      console.log('2. Device "Do Not Disturb" mode');
      console.log('3. Backend server logs for errors');
      console.log('4. OneSignal dashboard delivery status\n');
    } else {
      console.log('\n⚠️  ACTION REQUIRED: Admin users need to log into mobile app\n');
    }

    process.exit(usersWithoutPlayerId > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

diagnose();

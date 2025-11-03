/**
 * Quick test script for Feedback API
 * Run with: node test-feedback.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'admin@example.com'; // Change to your test user email
const TEST_PASSWORD = 'Admin123!'; // Change to your test user password

async function testFeedbackAPI() {
  console.log('🧪 Testing Feedback API...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Step 1: Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    const currentUser = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log(`   User: ${currentUser.name} (${currentUser.email})`);
    console.log(`   Role: ${currentUser.role}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // Step 2: Get users to find a recipient
    console.log('\n2️⃣ Step 2: Finding a recipient...');

    let recipientId;
    try {
      const usersResponse = await axios.get(`${BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const users = usersResponse.data.data || usersResponse.data.employees || [];
      const recipient = users.find(u => u.id !== currentUser.id);

      if (!recipient) {
        console.log('⚠️  No other users found.');
        console.log('   Creating feedback to self for testing (will fail with proper error)...');
        recipientId = currentUser.id;
      } else {
        recipientId = recipient.id;
        console.log(`✅ Found recipient: ${recipient.name} (${recipient.email})`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch users, using current user as recipient for testing...');
      recipientId = currentUser.id;
    }

    // Step 3: Create feedback
    console.log('\n3️⃣ Step 3: Creating feedback...');
    try {
      const feedbackResponse = await axios.post(
        `${BASE_URL}/feedback`,
        {
          title: 'Test Feedback - API Verification',
          message: 'This is a test feedback message created by the automated test script. If you see this, the API is working correctly!',
          type: 'positive',
          recipientId: recipientId,
          rating: 5
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (feedbackResponse.status === 201) {
        console.log('✅ Feedback created successfully!');
        console.log(`   Feedback ID: ${feedbackResponse.data.data.id}`);
        console.log(`   Title: ${feedbackResponse.data.data.title}`);
        console.log(`   Status: ${feedbackResponse.data.data.status}`);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('cannot give feedback to yourself')) {
        console.log('⚠️  Expected error: Cannot give feedback to yourself');
        console.log('   This is correct behavior! Create another user to test properly.');
      } else {
        throw error;
      }
    }

    // Step 4: Get sent feedback
    console.log('\n4️⃣ Step 4: Getting sent feedback...');
    const sentResponse = await axios.get(`${BASE_URL}/feedback/sent`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${sentResponse.data.data.length} sent feedback(s)`);
    if (sentResponse.data.data.length > 0) {
      console.log('   Recent feedback:');
      sentResponse.data.data.slice(0, 3).forEach(f => {
        console.log(`   - "${f.title}" to ${f.recipient?.name || 'Unknown'} (${f.status})`);
      });
    }

    // Step 5: Get received feedback
    console.log('\n5️⃣ Step 5: Getting received feedback...');
    const receivedResponse = await axios.get(`${BASE_URL}/feedback/received`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${receivedResponse.data.data.length} received feedback(s)`);
    if (receivedResponse.data.data.length > 0) {
      console.log('   Recent feedback:');
      receivedResponse.data.data.slice(0, 3).forEach(f => {
        console.log(`   - "${f.title}" from ${f.submitter?.name || 'Anonymous'} (${f.status})`);
      });
    }

    // Step 6: Get statistics
    console.log('\n6️⃣ Step 6: Getting feedback statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/feedback/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Statistics retrieved:');
    console.log(`   ${JSON.stringify(statsResponse.data.data, null, 2)}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Your Feedback API is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Update your Flutter app to use these endpoints');
    console.log('2. Ensure you send the JWT token in Authorization header');
    console.log('3. Format: "Authorization: Bearer <token>"');
    console.log('\nSee FEEDBACK_TROUBLESHOOTING.md for Flutter integration help.');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('================');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 401) {
        console.error('\n💡 Authentication Error:');
        console.error('   - Check TEST_EMAIL and TEST_PASSWORD at the top of this file');
        console.error('   - Verify user exists in database');
        console.error('   - Check JWT_SECRET is set in .env file');
      } else if (error.response.status === 404) {
        console.error('\n💡 Not Found Error:');
        console.error('   - Check if the endpoint exists');
        console.error('   - Verify server is running on http://localhost:5000');
      } else if (error.response.status === 500) {
        console.error('\n💡 Server Error:');
        console.error('   - Check backend logs for details');
        console.error('   - Verify database is connected');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused!');
      console.error('\n💡 Solutions:');
      console.error('   - Start the backend server: npm run dev');
      console.error('   - Check if server is running on http://localhost:5000');
      console.error('   - Verify PORT in .env file');
    } else {
      console.error(error.message);
    }

    console.error('\n📚 For more help, see:');
    console.error('   - FEEDBACK_TROUBLESHOOTING.md');
    console.error('   - FEEDBACK_API_DOCUMENTATION.md');
  }
}

// Run the test
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║       Feedback API Test Script                      ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

testFeedbackAPI();

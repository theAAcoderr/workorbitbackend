/**
 * Test script for Holiday API endpoints
 * Run with: node test_holiday_api.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_VERSION = 'v1';

// Test user credentials (update these with actual credentials)
const TEST_USER = {
  email: 'admin@workorbit.com',
  password: 'admin123'
};

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testLogin() {
  console.log('\n📝 Testing Login...');
  try {
    const response = await makeRequest('POST', `/api/${API_VERSION}/auth/login`, TEST_USER);

    if (response.statusCode === 200 && response.body.success) {
      authToken = response.body.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testGetHolidays() {
  console.log('\n📝 Testing GET /holidays...');
  try {
    const response = await makeRequest('GET', `/api/${API_VERSION}/holidays`, null, authToken);

    if (response.statusCode === 200) {
      console.log('✅ Get holidays successful');
      console.log(`   Count: ${response.body.count}`);
      console.log(`   Holidays:`, JSON.stringify(response.body.data, null, 2));
      return true;
    } else {
      console.log('❌ Get holidays failed:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Get holidays error:', error.message);
    return false;
  }
}

async function testCreateHoliday() {
  console.log('\n📝 Testing POST /holidays...');

  const holidayData = {
    name: 'Test Holiday',
    description: 'This is a test holiday created by the test script',
    date: '2025-12-25',
    type: 'company'
  };

  try {
    const response = await makeRequest('POST', `/api/${API_VERSION}/holidays`, holidayData, authToken);

    if (response.statusCode === 201) {
      console.log('✅ Create holiday successful');
      console.log(`   Created:`, JSON.stringify(response.body.data, null, 2));
      return response.body.data.id;
    } else {
      console.log('❌ Create holiday failed:', response.statusCode);
      console.log('   Response:', JSON.stringify(response.body, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Create holiday error:', error.message);
    return null;
  }
}

async function testUpdateHoliday(holidayId) {
  console.log('\n📝 Testing PUT /holidays/:id...');

  const updateData = {
    name: 'Updated Test Holiday',
    description: 'This holiday has been updated',
    date: '2025-12-26',
    type: 'optional'
  };

  try {
    const response = await makeRequest('PUT', `/api/${API_VERSION}/holidays/${holidayId}`, updateData, authToken);

    if (response.statusCode === 200) {
      console.log('✅ Update holiday successful');
      console.log(`   Updated:`, JSON.stringify(response.body.data, null, 2));
      return true;
    } else {
      console.log('❌ Update holiday failed:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Update holiday error:', error.message);
    return false;
  }
}

async function testDeleteHoliday(holidayId) {
  console.log('\n📝 Testing DELETE /holidays/:id...');

  try {
    const response = await makeRequest('DELETE', `/api/${API_VERSION}/holidays/${holidayId}`, null, authToken);

    if (response.statusCode === 200) {
      console.log('✅ Delete holiday successful');
      return true;
    } else {
      console.log('❌ Delete holiday failed:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete holiday error:', error.message);
    return false;
  }
}

async function testUpcomingHolidays() {
  console.log('\n📝 Testing GET /holidays/upcoming...');
  try {
    const response = await makeRequest('GET', `/api/${API_VERSION}/holidays/upcoming?limit=5`, null, authToken);

    if (response.statusCode === 200) {
      console.log('✅ Get upcoming holidays successful');
      console.log(`   Count: ${response.body.count}`);
      return true;
    } else {
      console.log('❌ Get upcoming holidays failed:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Get upcoming holidays error:', error.message);
    return false;
  }
}

async function testCheckHoliday(date) {
  console.log(`\n📝 Testing GET /holidays/check/${date}...`);
  try {
    const response = await makeRequest('GET', `/api/${API_VERSION}/holidays/check/${date}`, null, authToken);

    if (response.statusCode === 200) {
      console.log('✅ Check holiday successful');
      console.log(`   Is Holiday: ${response.body.isHoliday}`);
      return true;
    } else {
      console.log('❌ Check holiday failed:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Check holiday error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Holiday API Endpoint Test Suite     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n🔧 Base URL: ${BASE_URL}/api/${API_VERSION}`);
  console.log(`📧 Test User: ${TEST_USER.email}`);

  // Step 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication. Please check:');
    console.log('   1. Backend server is running');
    console.log('   2. Database is accessible');
    console.log('   3. Test user credentials are correct');
    process.exit(1);
  }

  // Step 2: Get initial holidays
  await testGetHolidays();

  // Step 3: Create a holiday
  const holidayId = await testCreateHoliday();

  if (holidayId) {
    // Step 4: Update the holiday
    await testUpdateHoliday(holidayId);

    // Step 5: Check if date is holiday
    await testCheckHoliday('2025-12-26');

    // Step 6: Get upcoming holidays
    await testUpcomingHolidays();

    // Step 7: Get holidays again to see the created one
    await testGetHolidays();

    // Step 8: Delete the holiday
    await testDeleteHoliday(holidayId);

    // Step 9: Verify deletion
    await testGetHolidays();
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         Test Suite Completed          ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Run the tests
runTests().catch(console.error);

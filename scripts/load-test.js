/**
 * Load Testing Script
 * Tests API performance under load
 * Run: node scripts/load-test.js
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.argv[2]) || 10;
const REQUESTS_PER_USER = parseInt(process.argv[3]) || 100;
const RAMP_UP_TIME = parseInt(process.argv[4]) || 10; // seconds

let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  responseTimes: [],
  errors: {}
};

/**
 * Make a single API request
 */
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const start = performance.now();
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000,
    };
    
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = performance.now() - start;
    
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.totalTime += duration;
    stats.responseTimes.push(duration);
    
    return { success: true, duration, status: response.status };
  } catch (error) {
    const duration = performance.now() - start;
    
    stats.totalRequests++;
    stats.failedRequests++;
    stats.responseTimes.push(duration);
    
    const errorKey = error.response?.status || error.code || 'unknown';
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
    
    return { success: false, duration, error: errorKey };
  }
}

/**
 * Simulate a user session
 */
async function simulateUser(userId) {
  console.log(`👤 User ${userId} starting...`);
  
  let token = null;
  
  // 1. Register
  const registerResult = await makeRequest('/api/v1/auth/register', 'POST', {
    email: `loadtest${userId}_${Date.now()}@example.com`,
    password: 'LoadTest123!@#',
    name: `Load Test User ${userId}`,
    phone: `123456${userId.toString().padStart(4, '0')}`
  });
  
  if (registerResult.success) {
    token = registerResult.data?.accessToken;
  }
  
  // 2. Login
  if (!token) {
    await makeRequest('/api/v1/auth/login', 'POST', {
      email: `loadtest${userId}@example.com`,
      password: 'LoadTest123!@#'
    });
  }
  
  // 3. Get profile
  await makeRequest('/api/v1/auth/me', 'GET', null, token);
  
  // 4. Check in
  await makeRequest('/api/v1/attendance/checkin', 'POST', {
    latitude: 40.7128 + (Math.random() * 0.1),
    longitude: -74.0060 + (Math.random() * 0.1),
    address: 'Test Address'
  }, token);
  
  // 5. Get attendance
  await makeRequest('/api/v1/attendance', 'GET', null, token);
  
  // 6. Get employees (if authorized)
  await makeRequest('/api/v1/employees', 'GET', null, token);
  
  // 7. Check out
  await makeRequest('/api/v1/attendance/checkout', 'POST', {
    latitude: 40.7128 + (Math.random() * 0.1),
    longitude: -74.0060 + (Math.random() * 0.1)
  }, token);
  
  console.log(`✅ User ${userId} completed`);
}

/**
 * Calculate statistics
 */
function calculateStats() {
  stats.responseTimes.sort((a, b) => a - b);
  
  const count = stats.responseTimes.length;
  const sum = stats.responseTimes.reduce((a, b) => a + b, 0);
  
  return {
    totalRequests: stats.totalRequests,
    successful: stats.successfulRequests,
    failed: stats.failedRequests,
    successRate: ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) + '%',
    
    averageResponseTime: (sum / count).toFixed(2) + 'ms',
    minResponseTime: stats.responseTimes[0]?.toFixed(2) + 'ms',
    maxResponseTime: stats.responseTimes[count - 1]?.toFixed(2) + 'ms',
    
    p50: stats.responseTimes[Math.floor(count * 0.5)]?.toFixed(2) + 'ms',
    p95: stats.responseTimes[Math.floor(count * 0.95)]?.toFixed(2) + 'ms',
    p99: stats.responseTimes[Math.floor(count * 0.99)]?.toFixed(2) + 'ms',
    
    requestsPerSecond: (stats.totalRequests / (stats.totalTime / 1000)).toFixed(2),
    
    errors: stats.errors
  };
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('\n📊 Load Test Configuration');
  console.log('='.repeat(50));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`Ramp-up Time: ${RAMP_UP_TIME}s`);
  console.log(`Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log('='.repeat(50) + '\n');
  
  const answer = await ask('Start load test? (y/n): ');
  if (answer.toLowerCase() !== 'y') {
    console.log('Test cancelled');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🚀 Starting load test...\n');
  const testStart = performance.now();
  
  // Ramp up users gradually
  const delayBetweenUsers = (RAMP_UP_TIME * 1000) / CONCURRENT_USERS;
  const users = [];
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(simulateUser(i + 1));
    
    if (i < CONCURRENT_USERS - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenUsers));
    }
  }
  
  // Wait for all users to complete
  await Promise.all(users);
  
  const testDuration = ((performance.now() - testStart) / 1000).toFixed(2);
  
  // Display results
  console.log('\n' + '='.repeat(50));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(50) + '\n');
  
  const results = calculateStats();
  
  console.log(`Total Requests:        ${results.totalRequests}`);
  console.log(`Successful:            ${results.successful} (${results.successRate})`);
  console.log(`Failed:                ${results.failed}`);
  console.log(``);
  console.log(`Average Response Time: ${results.averageResponseTime}`);
  console.log(`Min Response Time:     ${results.minResponseTime}`);
  console.log(`Max Response Time:     ${results.maxResponseTime}`);
  console.log(``);
  console.log(`50th Percentile (p50): ${results.p50}`);
  console.log(`95th Percentile (p95): ${results.p95}`);
  console.log(`99th Percentile (p99): ${results.p99}`);
  console.log(``);
  console.log(`Requests/Second:       ${results.requestsPerSecond}`);
  console.log(`Test Duration:         ${testDuration}s`);
  
  if (Object.keys(results.errors).length > 0) {
    console.log(``);
    console.log(`Errors by Type:`);
    Object.entries(results.errors).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Performance assessment
  console.log('\n📈 PERFORMANCE ASSESSMENT\n');
  
  const avgTime = parseFloat(results.averageResponseTime);
  const p95Time = parseFloat(results.p95);
  const successRate = parseFloat(results.successRate);
  
  if (successRate < 95) {
    console.log('❌ CRITICAL: Success rate below 95%');
  } else if (successRate < 99) {
    console.log('⚠️  WARNING: Success rate below 99%');
  } else {
    console.log('✅ GOOD: Success rate excellent');
  }
  
  if (p95Time > 1000) {
    console.log('❌ CRITICAL: p95 response time > 1000ms');
  } else if (p95Time > 500) {
    console.log('⚠️  WARNING: p95 response time > 500ms');
  } else {
    console.log('✅ GOOD: Response times acceptable');
  }
  
  if (avgTime > 500) {
    console.log('⚠️  WARNING: Average response time > 500ms');
  } else {
    console.log('✅ GOOD: Average response time acceptable');
  }
  
  console.log('');
  
  rl.close();
}

// Run load test
runLoadTest().catch(error => {
  console.error('\n❌ Load test error:', error);
  rl.close();
  process.exit(1);
});

/**
 * USAGE:
 * 
 * Basic test:
 *   node scripts/load-test.js
 * 
 * Custom parameters:
 *   node scripts/load-test.js <concurrent_users> <requests_per_user> <ramp_up_time>
 * 
 * Examples:
 *   node scripts/load-test.js 50 200 30
 *   # 50 concurrent users, 200 requests each, 30s ramp-up
 * 
 *   node scripts/load-test.js 100 100 60
 *   # 100 users, 100 requests, 60s ramp-up
 * 
 * For serious load testing, consider using:
 * - Apache Bench (ab)
 * - Artillery
 * - k6
 * - JMeter
 */


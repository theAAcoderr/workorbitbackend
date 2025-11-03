/**
 * WorkOrbit Services Health Check
 * This script tests all configured services
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

console.log('\n' + colors.blue + '='.repeat(60));
console.log('🔍 WorkOrbit Services Health Check');
console.log('='.repeat(60) + colors.reset + '\n');

// Results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper functions
function success(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
  results.passed++;
}

function error(message) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  results.failed++;
}

function warning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
  results.warnings++;
}

function info(message) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

// Test functions
async function testEnvironmentVariables() {
  console.log('\n📋 Testing Environment Variables...\n');

  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'ONESIGNAL_APP_ID',
    'ONESIGNAL_API_KEY',
    'PERPLEXITY_API_KEY'
  ];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      const value = varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('KEY')
        ? '***' + process.env[varName].slice(-4)
        : process.env[varName];
      success(`${varName}: ${value}`);
    } else {
      error(`${varName}: Not set`);
    }
  });

  // Optional vars
  const optionalVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'REDIS_HOST'
  ];

  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      const value = varName.includes('KEY') || varName.includes('SECRET')
        ? '***' + process.env[varName].slice(-4)
        : process.env[varName];
      info(`${varName}: ${value} (optional)`);
    }
  });
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...\n');

  const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  });

  try {
    await sequelize.authenticate();
    success('PostgreSQL connection successful');

    const [results] = await sequelize.query('SELECT version()');
    info(`Database version: ${results[0].version.split(' ')[1]}`);

    await sequelize.close();
  } catch (err) {
    error(`Database connection failed: ${err.message}`);
  }
}

async function testEmailService() {
  console.log('\n📧 Testing Email Service...\n');

  const nodemailer = require('nodemailer');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.verify();
    success('Email service connection verified');
    success(`SMTP configured: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    success(`From address: ${process.env.EMAIL_USER}`);
  } catch (err) {
    error(`Email service failed: ${err.message}`);
  }
}

async function testOneSignal() {
  console.log('\n🔔 Testing OneSignal Configuration...\n');

  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) {
    error('OneSignal credentials not configured');
    return;
  }

  if (process.env.ONESIGNAL_APP_ID.includes('your_') ||
      process.env.ONESIGNAL_API_KEY.includes('your_')) {
    error('OneSignal credentials are placeholder values');
    return;
  }

  success(`App ID: ${process.env.ONESIGNAL_APP_ID}`);
  success(`API Key: ${process.env.ONESIGNAL_API_KEY.slice(0, 20)}...`);

  // Test API connection
  try {
    const https = require('https');
    const options = {
      hostname: 'onesignal.com',
      path: `/api/v1/apps/${process.env.ONESIGNAL_APP_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
      }
    };

    const testConnection = new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    const appData = await testConnection;
    success('OneSignal API connection successful');
    success(`App Name: ${appData.name}`);
    info(`Players: ${appData.players || 0} subscribers`);
  } catch (err) {
    error(`OneSignal API test failed: ${err.message}`);
    warning('Check your API key and App ID in OneSignal dashboard');
  }
}

async function testAIService() {
  console.log('\n�� Testing AI Service (Perplexity)...\n');

  if (!process.env.PERPLEXITY_API_KEY) {
    error('Perplexity API key not configured');
    return;
  }

  if (process.env.PERPLEXITY_API_KEY.includes('your_')) {
    error('Perplexity API key is placeholder value');
    return;
  }

  success(`API Key: ${process.env.PERPLEXITY_API_KEY.slice(0, 10)}...`);
  success(`Model: ${process.env.PERPLEXITY_MODEL || 'sonar-pro'}`);

  // Test API connection with a simple query
  try {
    const https = require('https');
    const data = JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || 'sonar-pro',
      messages: [{
        role: 'user',
        content: 'Say "OK" if you can read this.'
      }],
      max_tokens: 10
    });

    const options = {
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const testConnection = new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(responseData));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    const response = await testConnection;
    if (response.choices && response.choices[0]) {
      success('Perplexity API connection successful');
      info(`Response: ${response.choices[0].message.content}`);
    }
  } catch (err) {
    error(`Perplexity API test failed: ${err.message}`);
  }
}

async function testAWSS3() {
  console.log('\n☁️  Testing AWS S3 Configuration...\n');

  if (process.env.USE_S3_STORAGE !== 'true') {
    info('S3 storage is disabled, using local storage');
    return;
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    error('AWS credentials not configured');
    return;
  }

  success(`Region: ${process.env.AWS_REGION || 'us-west-2'}`);
  success(`Bucket: ${process.env.AWS_S3_BUCKET_NAME || 'not set'}`);
  success(`Access Key: ${process.env.AWS_ACCESS_KEY_ID.slice(0, 10)}...`);

  info('AWS S3 credentials configured (connection test requires AWS SDK)');
}

// Main test runner
async function runAllTests() {
  const startTime = Date.now();

  try {
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testEmailService();
    await testOneSignal();
    await testAIService();
    await testAWSS3();
  } catch (err) {
    console.error('\nUnexpected error:', err);
  }

  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + colors.blue + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60) + colors.reset);
  console.log(colors.green + `✓ Passed: ${results.passed}` + colors.reset);
  console.log(colors.red + `✗ Failed: ${results.failed}` + colors.reset);
  console.log(colors.yellow + `⚠ Warnings: ${results.warnings}` + colors.reset);
  console.log(colors.blue + `⏱ Duration: ${duration}s` + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

  if (results.failed === 0) {
    console.log(colors.green + '🎉 All critical services are working!' + colors.reset + '\n');
  } else {
    console.log(colors.red + '❌ Some services failed. Please check the errors above.' + colors.reset + '\n');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();

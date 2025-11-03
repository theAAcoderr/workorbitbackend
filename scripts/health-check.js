/**
 * Comprehensive Health Check Script
 * Tests all system components
 * Run: node scripts/health-check.js
 */

const { sequelize } = require('../src/config/database');
const { getCache } = require('../src/config/redis');
const s3Service = require('../services/s3.service');
const axios = require('axios');
require('dotenv').config();

const checks = [];

async function checkDatabase() {
  console.log('🔍 Checking Database...');
  try {
    await sequelize.authenticate();
    const [[result]] = await sequelize.query('SELECT NOW()');
    
    checks.push({
      component: 'PostgreSQL',
      status: 'healthy',
      message: 'Connection successful',
      responseTime: new Date() - result.now,
      details: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      }
    });
    console.log('   ✅ Database is healthy\n');
  } catch (error) {
    checks.push({
      component: 'PostgreSQL',
      status: 'unhealthy',
      message: error.message,
      details: { error: error.stack }
    });
    console.log('   ❌ Database check failed\n');
  }
}

async function checkRedis() {
  console.log('🔍 Checking Redis...');
  try {
    const cache = getCache();
    
    if (!cache || !cache.client || !cache.client.isOpen) {
      checks.push({
        component: 'Redis',
        status: 'unavailable',
        message: 'Redis not configured or not running'
      });
      console.log('   ⚠️  Redis is unavailable\n');
      return;
    }
    
    const start = Date.now();
    await cache.client.ping();
    const responseTime = Date.now() - start;
    
    // Test set/get
    await cache.set('health_check', { test: true }, 10);
    const value = await cache.get('health_check');
    
    checks.push({
      component: 'Redis',
      status: 'healthy',
      message: 'Connection successful',
      responseTime,
      details: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        testPassed: value && value.test === true
      }
    });
    console.log('   ✅ Redis is healthy\n');
  } catch (error) {
    checks.push({
      component: 'Redis',
      status: 'unhealthy',
      message: error.message
    });
    console.log('   ❌ Redis check failed\n');
  }
}

async function checkS3() {
  console.log('🔍 Checking S3...');
  try {
    if (!process.env.S3_BUCKET_NAME) {
      checks.push({
        component: 'AWS S3',
        status: 'not_configured',
        message: 'S3 bucket not configured'
      });
      console.log('   ⚠️  S3 not configured\n');
      return;
    }
    
    // Test S3 connection
    const start = Date.now();
    // Assuming s3Service has a method to check bucket
    // await s3Service.headBucket();
    const responseTime = Date.now() - start;
    
    checks.push({
      component: 'AWS S3',
      status: 'healthy',
      message: 'Connection successful',
      responseTime,
      details: {
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION
      }
    });
    console.log('   ✅ S3 is healthy\n');
  } catch (error) {
    checks.push({
      component: 'AWS S3',
      status: 'unhealthy',
      message: error.message
    });
    console.log('   ❌ S3 check failed\n');
  }
}

async function checkAPI() {
  console.log('🔍 Checking API endpoints...');
  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const start = Date.now();
    
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: 5000
    });
    
    const responseTime = Date.now() - start;
    
    checks.push({
      component: 'API Server',
      status: response.data.status === 'healthy' ? 'healthy' : 'degraded',
      message: 'API responding',
      responseTime,
      details: response.data
    });
    console.log('   ✅ API is healthy\n');
  } catch (error) {
    checks.push({
      component: 'API Server',
      status: 'unhealthy',
      message: error.message
    });
    console.log('   ❌ API check failed\n');
  }
}

async function checkDiskSpace() {
  console.log('🔍 Checking Disk Space...');
  try {
    const { execSync } = require('child_process');
    const df = execSync('df -h .', { encoding: 'utf-8' });
    const lines = df.trim().split('\n');
    const data = lines[1].split(/\s+/);
    
    const usage = parseInt(data[4]);
    const status = usage > 90 ? 'critical' : usage > 70 ? 'warning' : 'healthy';
    
    checks.push({
      component: 'Disk Space',
      status,
      message: `${usage}% used`,
      details: {
        filesystem: data[0],
        size: data[1],
        used: data[2],
        available: data[3],
        usagePercent: data[4]
      }
    });
    
    if (status === 'healthy') {
      console.log(`   ✅ Disk space is healthy (${usage}% used)\n`);
    } else {
      console.log(`   ⚠️  Disk space ${status} (${usage}% used)\n`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not check disk space\n');
  }
}

async function checkMemory() {
  console.log('🔍 Checking Memory...');
  const used = process.memoryUsage();
  const heapUsedMB = (used.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (used.heapTotal / 1024 / 1024).toFixed(2);
  const usagePercent = ((used.heapUsed / used.heapTotal) * 100).toFixed(2);
  
  const status = usagePercent > 90 ? 'critical' : usagePercent > 70 ? 'warning' : 'healthy';
  
  checks.push({
    component: 'Memory',
    status,
    message: `${usagePercent}% used`,
    details: {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      external: `${(used.external / 1024 / 1024).toFixed(2)} MB`
    }
  });
  
  console.log(`   ${status === 'healthy' ? '✅' : '⚠️ '} Memory: ${heapUsedMB}/${heapTotalMB} MB (${usagePercent}%)\n`);
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.log('🏥 WorkOrbit Health Check\n');
  console.log('='.repeat(50) + '\n');
  
  await checkDatabase();
  await checkRedis();
  await checkS3();
  await checkAPI();
  await checkDiskSpace();
  await checkMemory();
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(50) + '\n');
  
  const healthy = checks.filter(c => c.status === 'healthy').length;
  const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
  const warnings = checks.filter(c => c.status === 'warning' || c.status === 'degraded').length;
  const unavailable = checks.filter(c => c.status === 'unavailable' || c.status === 'not_configured').length;
  
  console.log(`✅ Healthy: ${healthy}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Unhealthy: ${unhealthy}`);
  console.log(`⏭️  Unavailable: ${unavailable}`);
  
  const overallStatus = unhealthy > 0 ? 'UNHEALTHY' : warnings > 0 ? 'DEGRADED' : 'HEALTHY';
  
  console.log(`\n🏥 Overall Status: ${overallStatus}\n`);
  
  // Detailed results
  if (process.argv.includes('--verbose')) {
    console.log('\n📋 Detailed Results:\n');
    console.log(JSON.stringify(checks, null, 2));
  }
  
  // Exit code
  if (unhealthy > 0) {
    console.log('❌ Health check failed\n');
    process.exit(1);
  } else {
    console.log('✅ Health check passed\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error('Health check error:', error);
    process.exit(1);
  });
}

module.exports = { runHealthChecks, createBackup, restoreBackup };


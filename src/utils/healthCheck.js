const { sequelize } = require('../config/database');

/**
 * Health check utilities for liveness and readiness probes
 */

// Check database connection
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    return { status: 'healthy', message: 'Database connection OK', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', message: error.message, timestamp: new Date() };
  }
}

// Check memory usage
function checkMemory() {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const percentage = Math.round((heapUsedMB / heapTotalMB) * 100);

  return {
    status: percentage < 90 ? 'healthy' : 'warning',
    heapUsed: `${heapUsedMB} MB`,
    heapTotal: `${heapTotalMB} MB`,
    percentage: `${percentage}%`,
    timestamp: new Date()
  };
}

// Check uptime
function checkUptime() {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  return {
    status: 'healthy',
    uptime: `${days}d ${hours}h ${minutes}m`,
    seconds: uptime,
    timestamp: new Date()
  };
}

// Liveness probe - is the app running?
async function livenessProbe() {
  return {
    status: 'alive',
    timestamp: new Date(),
    uptime: checkUptime()
  };
}

// Readiness probe - can the app serve traffic?
async function readinessProbe() {
  const checks = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkUptime())
  ]);

  const [db, memory, uptime] = checks;

  const isReady = db.status === 'healthy' && memory.status !== 'unhealthy';

  return {
    status: isReady ? 'ready' : 'not_ready',
    checks: {
      database: db,
      memory,
      uptime
    },
    timestamp: new Date()
  };
}

// Full health check
async function fullHealthCheck() {
  const [db, memory, uptime] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkUptime())
  ]);

  const overallStatus =
    db.status === 'healthy' && memory.status !== 'unhealthy'
      ? 'healthy'
      : 'unhealthy';

  return {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: db,
      memory,
      uptime
    },
    timestamp: new Date()
  };
}

module.exports = {
  livenessProbe,
  readinessProbe,
  fullHealthCheck,
  checkDatabase,
  checkMemory,
  checkUptime
};

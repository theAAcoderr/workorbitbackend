const { logger } = require('../middleware/logger');
const { sequelize } = require('../config/database');

/**
 * Graceful shutdown handler
 * Ensures clean shutdown without data loss
 */

let server = null;
let isShuttingDown = false;

// Set the server instance
function setServer(serverInstance) {
  server = serverInstance;
}

// Graceful shutdown function
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Give server 30 seconds to close existing connections
  const shutdownTimeout = setTimeout(() => {
    logger.error('Shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 30000);

  try {
    // Step 1: Stop accepting new requests
    if (server) {
      logger.info('Closing HTTP server (stop accepting new connections)...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed successfully');
    }

    // Step 2: Wait for in-flight requests to complete
    logger.info('Waiting for in-flight requests to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Close database connections
    logger.info('Closing database connections...');
    await sequelize.close();
    logger.info('Database connections closed');

    // Step 4: Close any other resources (Redis, queues, etc.)
    // TODO: Close Bull queues, Redis, etc.

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Register shutdown handlers
function registerShutdownHandlers() {
  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', { reason, promise });
    gracefulShutdown('unhandledRejection');
  });

  logger.info('Shutdown handlers registered');
}

module.exports = {
  setServer,
  gracefulShutdown,
  registerShutdownHandlers
};

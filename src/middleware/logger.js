const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'workorbit-api' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      logger.error('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Audit logger for sensitive operations
const auditLog = async (action, userId, details, req) => {
  const auditData = {
    action,
    userId,
    details,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('user-agent'),
    timestamp: new Date().toISOString()
  };

  logger.info('Audit log', auditData);

  // Also save to database if ActivityLog model is available
  try {
    const { ActivityLog } = require('../models');
    if (ActivityLog) {
      await ActivityLog.create({
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress: auditData.ip,
        userAgent: auditData.userAgent
      });
    }
  } catch (error) {
    logger.error('Failed to save audit log to database', { error: error.message });
  }
};

// Error logger
const logError = (error, req) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    url: req?.originalUrl,
    method: req?.method,
    userId: req?.user?.id,
    body: req?.body
  });
};

module.exports = {
  logger,
  requestLogger,
  auditLog,
  logError
};

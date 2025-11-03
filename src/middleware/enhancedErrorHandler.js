/**
 * Enhanced Error Handling Middleware
 * Provides better error responses with request tracking
 */

const { logger, logError } = require('./logger');

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false);
    this.name = 'DatabaseError';
  }
}

/**
 * Enhanced Error Handler Middleware
 */
const enhancedErrorHandler = (err, req, res, next) => {
  // Log error with full context
  const errorContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    body: req.body,
    params: req.params,
    query: req.query
  };
  
  // Determine if error is operational or programming error
  const isOperational = err.isOperational !== undefined ? err.isOperational : false;
  
  // Log based on severity
  if (!isOperational || err.statusCode >= 500) {
    logger.error('Application error', {
      ...errorContext,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
      }
    });
  } else {
    logger.warn('Operational error', {
      ...errorContext,
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode
      }
    });
  }
  
  // Prepare error response
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error',
    requestId: req.id,
    timestamp: new Date().toISOString()
  };
  
  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.errors = err.errors;
  }
  
  // Add stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      isOperational
    };
  }
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN && !isOperational) {
    // Sentry.captureException(err, { extra: errorContext });
  }
  
  // Send response
  res.status(statusCode).json(errorResponse);
  
  // If programming error in production, log and alert
  if (!isOperational && process.env.NODE_ENV === 'production') {
    // Send alert to team
    logger.error('CRITICAL: Programming error in production', {
      error: err.message,
      stack: err.stack,
      requestId: req.id
    });
  }
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Sequelize error handler
 * Converts Sequelize errors to operational errors
 */
const sequelizeErrorHandler = (err, req, res, next) => {
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return next(new ValidationError('Validation failed', errors));
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return next(new ConflictError(`${field} already exists`));
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return next(new ValidationError('Invalid reference'));
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return next(new DatabaseError(err.message));
  }
  
  next(err);
};

/**
 * Unhandled rejection handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
  
  // Don't crash in production, but log it
  if (process.env.NODE_ENV !== 'production') {
    throw reason;
  }
});

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  console.error('❌ Uncaught Exception! Shutting down...');
  process.exit(1);
});

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  
  // Middleware
  enhancedErrorHandler,
  asyncHandler,
  notFound,
  sequelizeErrorHandler
};

/**
 * USAGE IN server.js:
 * 
 * const {
 *   enhancedErrorHandler,
 *   sequelizeErrorHandler,
 *   notFound
 * } = require('./middleware/enhancedErrorHandler');
 * 
 * // Add before other error handlers
 * app.use(sequelizeErrorHandler);
 * app.use(notFound);
 * app.use(enhancedErrorHandler);
 * 
 * 
 * USAGE IN CONTROLLERS:
 * 
 * const { asyncHandler, NotFoundError } = require('../middleware/enhancedErrorHandler');
 * 
 * const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findByPk(req.params.id);
 *   
 *   if (!user) {
 *     throw new NotFoundError('User');
 *   }
 *   
 *   res.json({ success: true, data: { user } });
 * });
 * 
 * // No need for try/catch! asyncHandler catches errors automatically
 */


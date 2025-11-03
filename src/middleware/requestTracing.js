const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

/**
 * Request tracing middleware
 * Adds unique ID to each request for distributed tracing
 */
const requestTracing = (req, res, next) => {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  const correlationId = req.headers['x-correlation-id'] || requestId;

  // Attach to request object
  req.id = requestId;
  req.correlationId = correlationId;

  // Set response headers
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request start
  const startTime = Date.now();
  const requestInfo = {
    requestId,
    correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  logger.info('Request started', requestInfo);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

/**
 * Error context enrichment
 * Adds request context to errors
 */
const enrichErrorContext = (err, req) => {
  return {
    ...err,
    requestId: req.id,
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
    userId: req.user?.id,
    ip: req.ip
  };
};

module.exports = {
  requestTracing,
  enrichErrorContext
};

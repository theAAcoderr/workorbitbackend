const { getCache } = require('../config/redis');
const { logger } = require('./logger');

/**
 * Per-user rate limiting middleware
 */
const userRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.user?.id || req.ip
  } = options;

  return async (req, res, next) => {
    try {
      const cache = getCache();

      if (!cache) {
        // If Redis is not available, skip rate limiting
        return next();
      }

      const key = `ratelimit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get current request count
      let requestData = await cache.get(key);

      if (!requestData) {
        requestData = {
          requests: [],
          resetTime: now + windowMs
        };
      }

      // Filter out old requests
      requestData.requests = requestData.requests.filter(
        timestamp => timestamp > windowStart
      );

      // Check if limit exceeded
      if (requestData.requests.length >= maxRequests) {
        const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', requestData.resetTime);
        res.setHeader('Retry-After', retryAfter);

        logger.warn('Rate limit exceeded', {
          userId: req.user?.id,
          ip: req.ip,
          path: req.path
        });

        return res.status(429).json({
          success: false,
          message,
          retryAfter: `${retryAfter} seconds`
        });
      }

      // Add current request
      requestData.requests.push(now);

      // Save to cache
      const ttl = Math.ceil(windowMs / 1000);
      await cache.set(key, requestData, ttl);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - requestData.requests.length);
      res.setHeader('X-RateLimit-Reset', requestData.resetTime);

      // Handle skipSuccessfulRequests
      if (skipSuccessfulRequests) {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            // Remove this request from count if successful
            requestData.requests.pop();
            await cache.set(key, requestData, ttl);
          }
        });
      }

      next();
    } catch (error) {
      logger.error('User rate limit error:', error);
      // On error, allow request to proceed
      next();
    }
  };
};

/**
 * Create tier-based rate limiting
 */
const tierRateLimit = (tiers = {}) => {
  const defaultTiers = {
    admin: { windowMs: 60000, maxRequests: 1000 },
    hr: { windowMs: 60000, maxRequests: 500 },
    manager: { windowMs: 60000, maxRequests: 300 },
    employee: { windowMs: 60000, maxRequests: 100 },
    ...tiers
  };

  return (req, res, next) => {
    const userRole = req.user?.role || 'employee';
    const tierConfig = defaultTiers[userRole] || defaultTiers.employee;

    const rateLimitMiddleware = userRateLimit(tierConfig);
    rateLimitMiddleware(req, res, next);
  };
};

/**
 * Endpoint-specific rate limiting
 */
const endpointRateLimit = (limits = {}) => {
  return (req, res, next) => {
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    const config = limits[endpoint] || { windowMs: 60000, maxRequests: 100 };

    const rateLimitMiddleware = userRateLimit(config);
    rateLimitMiddleware(req, res, next);
  };
};

module.exports = {
  userRateLimit,
  tierRateLimit,
  endpointRateLimit
};

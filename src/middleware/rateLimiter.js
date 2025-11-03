const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development if needed
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  }
});

// Strict rate limiter for authentication endpoints (per user account, not per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per user account
  keyGenerator: (req) => {
    // Use email from request body for rate limiting (per user, not per IP)
    // Fallback to a constant string instead of IP to avoid IPv6 validation
    return req.body.email || 'anonymous';
  },
  message: {
    success: false,
    message: 'Too many login attempts for this account, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// OTP request limiter (per user account, not per IP)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour per user
  keyGenerator: (req) => {
    // Use email from request body for rate limiting (per user, not per IP)
    // Fallback to a constant string instead of IP to avoid IPv6 validation
    return req.body.email || 'anonymous';
  },
  message: {
    success: false,
    message: 'Too many OTP requests for this account. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Report generation limiter
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 reports per 10 minutes
  message: {
    success: false,
    message: 'Report generation limit exceeded. Please wait before generating more reports.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
  reportLimiter
};

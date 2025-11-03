const validator = require('validator');

/**
 * Sanitize user input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

/**
 * Sanitize individual values
 */
const sanitizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  // Don't escape URLs (they should remain as-is for S3, external links, etc.)
  // Check if the value is a URL
  if (validator.isURL(value, { require_protocol: true })) {
    return value;
  }

  // Don't escape UUIDs
  if (validator.isUUID(value)) {
    return value;
  }

  // Escape HTML to prevent XSS for other strings
  return validator.escape(value);
};

/**
 * Validate and sanitize coordinates
 */
const sanitizeCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude !== undefined) {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be between -90 and 90.'
      });
    }
    req.body.latitude = lat;
  }

  if (longitude !== undefined) {
    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be between -180 and 180.'
      });
    }
    req.body.longitude = lng;
  }

  next();
};

/**
 * Sanitize and validate date ranges
 */
const sanitizeDateRange = (req, res, next) => {
  const { startDate, endDate } = req.body;

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format.'
      });
    }
    req.body.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format.'
      });
    }
    req.body.endDate = end;
  }

  if (startDate && endDate) {
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date.'
      });
    }
  }

  next();
};

/**
 * Prevent mass assignment vulnerabilities
 */
const allowedFields = (allowedFieldsList) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const filteredBody = {};
    for (const field of allowedFieldsList) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        filteredBody[field] = req.body[field];
      }
    }

    req.body = filteredBody;
    next();
  };
};

module.exports = {
  sanitizeInput,
  sanitizeCoordinates,
  sanitizeDateRange,
  allowedFields
};

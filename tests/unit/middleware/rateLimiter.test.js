/**
 * Unit Tests for Rate Limiter Middleware
 */

const rateLimit = require('express-rate-limit');
const {
  apiLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
  reportLimiter
} = require('../../../src/middleware/rateLimiter');

// Mock express-rate-limit
jest.mock('express-rate-limit');

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('apiLimiter', () => {
    it('should be configured with correct defaults', () => {
      expect(rateLimit).toHaveBeenCalled();
      
      const config = rateLimit.mock.calls.find(call => 
        call[0].windowMs === (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000)
      );
      
      expect(config).toBeDefined();
    });
  });
  
  describe('authLimiter', () => {
    it('should use email as key generator', () => {
      expect(rateLimit).toHaveBeenCalled();
      
      const authConfig = rateLimit.mock.calls.find(call => 
        call[0].max === 5 && call[0].windowMs === 15 * 60 * 1000
      );
      
      expect(authConfig).toBeDefined();
      expect(authConfig[0].keyGenerator).toBeDefined();
      
      // Test key generator
      const keyGen = authConfig[0].keyGenerator;
      expect(keyGen({ body: { email: 'test@example.com' } })).toBe('test@example.com');
      expect(keyGen({ body: {} })).toBe('anonymous');
    });
    
    it('should skip successful requests', () => {
      const authConfig = rateLimit.mock.calls.find(call => 
        call[0].max === 5
      );
      
      expect(authConfig[0].skipSuccessfulRequests).toBe(true);
    });
  });
  
  describe('otpLimiter', () => {
    it('should limit OTP requests per user', () => {
      const otpConfig = rateLimit.mock.calls.find(call => 
        call[0].max === 3 && call[0].windowMs === 60 * 60 * 1000
      );
      
      expect(otpConfig).toBeDefined();
    });
  });
  
  describe('uploadLimiter', () => {
    it('should limit file uploads', () => {
      const uploadConfig = rateLimit.mock.calls.find(call => 
        call[0].max === 20
      );
      
      expect(uploadConfig).toBeDefined();
    });
  });
  
  describe('reportLimiter', () => {
    it('should limit report generation', () => {
      const reportConfig = rateLimit.mock.calls.find(call => 
        call[0].max === 10 && call[0].windowMs === 10 * 60 * 1000
      );
      
      expect(reportConfig).toBeDefined();
    });
  });
});


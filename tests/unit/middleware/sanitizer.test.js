/**
 * Unit Tests for Input Sanitizer Middleware
 */

const {
  sanitizeInput,
  sanitizeCoordinates,
  sanitizeDateRange,
  allowedFields
} = require('../../../src/middleware/sanitizer');

describe('Sanitizer Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = global.testUtils.createMockRequest();
    res = global.testUtils.createMockResponse();
    next = global.testUtils.createMockNext();
  });
  
  describe('sanitizeInput', () => {
    it('should sanitize HTML in body', () => {
      req.body = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body.name).not.toContain('<script>');
      expect(req.body.name).toContain('alert');
      expect(next).toHaveBeenCalled();
    });
    
    it('should preserve URLs', () => {
      req.body = {
        website: 'https://example.com/page?param=value',
        profilePic: 'https://s3.amazonaws.com/bucket/image.jpg'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body.website).toBe('https://example.com/page?param=value');
      expect(req.body.profilePic).toBe('https://s3.amazonaws.com/bucket/image.jpg');
      expect(next).toHaveBeenCalled();
    });
    
    it('should preserve UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      req.body = { userId: uuid };
      
      sanitizeInput(req, res, next);
      
      expect(req.body.userId).toBe(uuid);
      expect(next).toHaveBeenCalled();
    });
    
    it('should sanitize query parameters', () => {
      req.query = {
        search: '<img src=x onerror=alert(1)>',
        sort: 'name'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.query.search).not.toContain('<img');
      expect(req.query.sort).toBe('name');
    });
    
    it('should handle nested objects', () => {
      req.body = {
        user: {
          name: '<script>alert(1)</script>',
          address: {
            street: '<b>Main St</b>'
          }
        }
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body.user.name).not.toContain('<script>');
      expect(req.body.user.address.street).not.toContain('<b>');
    });
    
    it('should handle arrays', () => {
      req.body = {
        tags: ['<script>alert(1)</script>', 'valid tag', '<b>bold</b>']
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body.tags[0]).not.toContain('<script>');
      expect(req.body.tags[1]).toBe('valid tag');
      expect(req.body.tags[2]).not.toContain('<b>');
    });
  });
  
  describe('sanitizeCoordinates', () => {
    it('should accept valid coordinates', () => {
      req.body = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      sanitizeCoordinates(req, res, next);
      
      expect(req.body.latitude).toBe(40.7128);
      expect(req.body.longitude).toBe(-74.0060);
      expect(next).toHaveBeenCalled();
    });
    
    it('should reject invalid latitude', () => {
      req.body = {
        latitude: 91, // Invalid: > 90
        longitude: 0
      };
      
      sanitizeCoordinates(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('latitude')
      });
    });
    
    it('should reject invalid longitude', () => {
      req.body = {
        latitude: 0,
        longitude: 181 // Invalid: > 180
      };
      
      sanitizeCoordinates(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('longitude')
      });
    });
    
    it('should convert string coordinates to numbers', () => {
      req.body = {
        latitude: '40.7128',
        longitude: '-74.0060'
      };
      
      sanitizeCoordinates(req, res, next);
      
      expect(req.body.latitude).toBe(40.7128);
      expect(req.body.longitude).toBe(-74.0060);
      expect(typeof req.body.latitude).toBe('number');
    });
  });
  
  describe('sanitizeDateRange', () => {
    it('should accept valid date range', () => {
      req.body = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
      
      sanitizeDateRange(req, res, next);
      
      expect(req.body.startDate).toBeInstanceOf(Date);
      expect(req.body.endDate).toBeInstanceOf(Date);
      expect(next).toHaveBeenCalled();
    });
    
    it('should reject invalid start date', () => {
      req.body = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };
      
      sanitizeDateRange(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('start date')
      });
    });
    
    it('should reject start date after end date', () => {
      req.body = {
        startDate: '2024-02-01',
        endDate: '2024-01-01'
      };
      
      sanitizeDateRange(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('before end date')
      });
    });
  });
  
  describe('allowedFields', () => {
    it('should only allow specified fields', () => {
      req.body = {
        name: 'John',
        email: 'john@example.com',
        role: 'admin', // Not allowed
        password: 'secret' // Not allowed
      };
      
      const middleware = allowedFields(['name', 'email']);
      middleware(req, res, next);
      
      expect(req.body.name).toBe('John');
      expect(req.body.email).toBe('john@example.com');
      expect(req.body.role).toBeUndefined();
      expect(req.body.password).toBeUndefined();
    });
    
    it('should handle empty allowed fields', () => {
      req.body = {
        name: 'John',
        email: 'john@example.com'
      };
      
      const middleware = allowedFields([]);
      middleware(req, res, next);
      
      expect(Object.keys(req.body).length).toBe(0);
    });
    
    it('should handle missing body', () => {
      delete req.body;
      
      const middleware = allowedFields(['name']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});


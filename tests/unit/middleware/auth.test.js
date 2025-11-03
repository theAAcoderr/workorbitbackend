/**
 * Unit Tests for Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { authMiddleware, authorizeRoles } = require('../../../src/middleware/auth');
const { User } = require('../../../src/models');

// Mock User model
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Authentication Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = global.testUtils.createMockRequest();
    res = global.testUtils.createMockResponse();
    next = global.testUtils.createMockNext();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test_secret';
  });
  
  describe('authMiddleware', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'employee',
        status: 'active'
      };
      
      const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };
      
      User.findByPk.mockResolvedValue(mockUser);
      
      await authMiddleware(req, res, next);
      
      expect(req.user).toEqual(mockUser);
      expect(req.token).toBe(token);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should reject missing token', async () => {
      await authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authentication token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should reject invalid token', async () => {
      req.headers = { authorization: 'Bearer invalid_token' };
      
      await authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should reject expired token', async () => {
      const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers = { authorization: `Bearer ${token}` };
      
      await authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired'
      });
    });
    
    it('should reject inactive user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        status: 'inactive'
      };
      
      const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };
      
      User.findByPk.mockResolvedValue(mockUser);
      
      await authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is inactive or suspended'
      });
    });
    
    it('should reject non-existent user', async () => {
      const token = jwt.sign({ id: '999' }, process.env.JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };
      
      User.findByPk.mockResolvedValue(null);
      
      await authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });
  
  describe('authorizeRoles', () => {
    beforeEach(() => {
      req.user = {
        id: '123',
        email: 'test@example.com',
        role: 'employee'
      };
    });
    
    it('should allow authorized role', () => {
      const middleware = authorizeRoles('employee', 'admin');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should block unauthorized role', () => {
      const middleware = authorizeRoles('admin', 'hr');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('not authorized')
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle array of roles', () => {
      const middleware = authorizeRoles(['admin', 'employee']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('should be case insensitive', () => {
      const middleware = authorizeRoles('EMPLOYEE');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('should require authentication', () => {
      delete req.user;
      const middleware = authorizeRoles('admin');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });
});


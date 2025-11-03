/**
 * Unit Tests for Auth Controller
 */

const { login, register } = require('../../../src/controllers/authController');
const { User, Organization } = require('../../../src/models');
const { generateTokens } = require('../../../src/utils/jwt');

// Mock dependencies
jest.mock('../../../src/models');
jest.mock('../../../src/utils/jwt');

describe('Auth Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = global.testUtils.createMockRequest();
    res = global.testUtils.createMockResponse();
    next = global.testUtils.createMockNext();
    
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        phone: '1234567890'
      };
      
      req.body = userData;
      
      // Mock User.findOne to return null (no existing user)
      User.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock User.create
      const mockUser = {
        id: '123',
        ...userData,
        password: 'hashed_password',
        toJSON: jest.fn().mockReturnValue({ id: '123', email: userData.email })
      };
      User.create = jest.fn().mockResolvedValue(mockUser);
      
      // Mock token generation
      generateTokens.mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      });
      
      await register(req, res);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful',
        data: expect.objectContaining({
          user: expect.any(Object),
          accessToken: 'access_token'
        })
      });
    });
    
    it('should reject duplicate email', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'User'
      };
      
      // Mock existing user
      User.findOne = jest.fn().mockResolvedValue({ id: '123' });
      
      await register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });
  });
  
  describe('login', () => {
    it('should login with valid credentials', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'Password123!'
      };
      
      const mockUser = {
        id: '123',
        email: 'user@example.com',
        password: 'hashed_password',
        role: 'employee',
        status: 'active',
        comparePassword: jest.fn().mockResolvedValue(true),
        isLocked: jest.fn().mockReturnValue(false),
        resetLoginAttempts: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: '123', email: 'user@example.com' })
      };
      
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      
      generateTokens.mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      });
      
      await login(req, res);
      
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          user: expect.any(Object),
          accessToken: 'access_token'
        })
      });
    });
    
    it('should reject invalid email', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };
      
      User.findOne = jest.fn().mockResolvedValue(null);
      
      await login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });
    
    it('should reject invalid password', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'WrongPassword'
      };
      
      const mockUser = {
        id: '123',
        comparePassword: jest.fn().mockResolvedValue(false),
        isLocked: jest.fn().mockReturnValue(false),
        incrementLoginAttempts: jest.fn()
      };
      
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      
      await login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });
    
    it('should reject locked account', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'Password123!'
      };
      
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      const mockUser = {
        id: '123',
        isLocked: jest.fn().mockReturnValue(true),
        lockUntil
      };
      
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      
      await login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('locked')
      });
    });
  });
});


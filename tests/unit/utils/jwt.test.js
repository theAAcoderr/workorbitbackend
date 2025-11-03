/**
 * Unit Tests for JWT Utilities
 */

const jwt = require('jsonwebtoken');
const { generateTokens, verifyToken } = require('../../../src/utils/jwt');

describe('JWT Utilities', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'employee'
  };
  
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });
  
  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
    
    it('should include user id in access token', () => {
      const tokens = generateTokens(mockUser);
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      
      expect(decoded.id).toBe(mockUser.id);
    });
    
    it('should include user id in refresh token', () => {
      const tokens = generateTokens(mockUser);
      const decoded = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
      
      expect(decoded.id).toBe(mockUser.id);
    });
    
    it('should set correct expiration for access token', () => {
      const tokens = generateTokens(mockUser);
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBeGreaterThan(0);
    });
  });
  
  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });
      
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser.id);
    });
    
    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid_token');
      }).toThrow();
    });
    
    it('should throw error for expired token', () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET, {
        expiresIn: '-1s'
      });
      
      expect(() => {
        verifyToken(token);
      }).toThrow();
    });
    
    it('should verify refresh token with correct secret', () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
      });
      
      const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
      
      expect(decoded.id).toBe(mockUser.id);
    });
  });
});


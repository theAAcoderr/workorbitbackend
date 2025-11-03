/**
 * Integration Tests for Auth API
 */

const request = require('supertest');
const app = require('../../../src/server');
const { User, Organization } = require('../../../src/models');
const { sequelize } = require('../../../src/config/database');

describe('Auth API Integration Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  beforeEach(async () => {
    // Clean database before each test
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Organization.destroy({ where: {}, truncate: true, cascade: true });
  });
  
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        phone: '1234567890'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });
    
    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);
      
      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
    
    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',  // Too weak
        name: 'Test User'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    const validUser = {
      email: 'login@example.com',
      password: 'Test123!@#',
      name: 'Login User'
    };
    
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);
    });
    
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.accessToken).toBeDefined();
    });
    
    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: validUser.password
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });
    
    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should return refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);
      
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });
  });
  
  describe('GET /api/v1/auth/me', () => {
    let accessToken;
    
    beforeEach(async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'me@example.com',
          password: 'Test123!@#',
          name: 'Me User'
        });
      
      accessToken = registerResponse.body.data.accessToken;
    });
    
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('me@example.com');
    });
    
    it('should reject request without token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });
    
    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });
  
  describe('POST /api/v1/auth/logout', () => {
    let accessToken;
    
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'Test123!@#',
          name: 'Logout User'
        });
      
      accessToken = response.body.data.accessToken;
    });
    
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });
  });
});


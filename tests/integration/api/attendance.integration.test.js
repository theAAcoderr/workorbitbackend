/**
 * Integration Tests for Attendance API
 */

const request = require('supertest');
const app = require('../../../src/server');
const { User, Attendance, Organization } = require('../../../src/models');
const { sequelize } = require('../../../src/config/database');

describe('Attendance API Integration Tests', () => {
  let accessToken;
  let userId;
  let organizationId;
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  beforeEach(async () => {
    // Clean database
    await Attendance.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Organization.destroy({ where: {}, truncate: true, cascade: true });
    
    // Create test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'employee@example.com',
        password: 'Test123!@#',
        name: 'Test Employee',
        phone: '1234567890'
      });
    
    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;
  });
  
  describe('POST /api/v1/attendance/checkin', () => {
    it('should check in successfully with valid coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeDefined();
      expect(response.body.data.attendance.checkInTime).toBeDefined();
    });
    
    it('should reject check-in without coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject check-in with invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 91, // Invalid
          longitude: 0
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject check-in without authentication', async () => {
      await request(app)
        .post('/api/v1/attendance/checkin')
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(401);
    });
    
    it('should prevent duplicate check-in on same day', async () => {
      // First check-in
      await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(200);
      
      // Second check-in (should fail)
      const response = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already checked in');
    });
  });
  
  describe('POST /api/v1/attendance/checkout', () => {
    beforeEach(async () => {
      // Check in first
      await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });
    });
    
    it('should check out successfully', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance.checkOutTime).toBeDefined();
    });
    
    it('should reject checkout without prior check-in', async () => {
      // Create new user without check-in
      const newUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          name: 'New User'
        });
      
      const newToken = newUserResponse.body.data.accessToken;
      
      const response = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not checked in');
    });
    
    it('should calculate work duration correctly', async () => {
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(200);
      
      expect(response.body.data.attendance.workDuration).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/v1/attendance', () => {
    beforeEach(async () => {
      // Create some attendance records
      await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });
    });
    
    it('should get attendance records', async () => {
      const response = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeDefined();
      expect(Array.isArray(response.body.data.attendance)).toBe(true);
      expect(response.body.data.attendance.length).toBeGreaterThan(0);
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/attendance?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.data.attendance).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });
    
    it('should support date filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/v1/attendance?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('GET /api/v1/attendance/today', () => {
    it('should get today\'s attendance', async () => {
      // Check in
      await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });
      
      const response = await request(app)
        .get('/api/v1/attendance/today')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeDefined();
    });
    
    it('should return null if not checked in today', async () => {
      const response = await request(app)
        .get('/api/v1/attendance/today')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.data.attendance).toBeNull();
    });
  });
});


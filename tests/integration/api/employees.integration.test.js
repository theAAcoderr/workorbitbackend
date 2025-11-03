/**
 * Integration Tests for Employees API
 */

const request = require('supertest');
const app = require('../../../src/server');
const { User, Organization } = require('../../../src/models');
const { sequelize } = require('../../../src/config/database');

describe('Employees API Integration Tests', () => {
  let adminToken;
  let hrToken;
  let employeeToken;
  let organizationId;
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  beforeEach(async () => {
    // Clean database
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Organization.destroy({ where: {}, truncate: true, cascade: true });
    
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
        name: 'Admin User',
        role: 'admin'
      });
    
    adminToken = adminResponse.body.data.accessToken;
    organizationId = adminResponse.body.data.user.organizationId;
    
    // Create HR user
    const hrResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'hr@example.com',
        password: 'Hr123!@#',
        name: 'HR User',
        role: 'hr'
      });
    
    hrToken = hrResponse.body.data.accessToken;
    
    // Create employee user
    const employeeResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'employee@example.com',
        password: 'Employee123!@#',
        name: 'Employee User'
      });
    
    employeeToken = employeeResponse.body.data.accessToken;
  });
  
  describe('GET /api/v1/employees', () => {
    it('should allow admin to get all employees', async () => {
      const response = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toBeDefined();
      expect(Array.isArray(response.body.data.employees)).toBe(true);
    });
    
    it('should allow HR to get all employees', async () => {
      const response = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should reject employee from listing all', async () => {
      const response = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/v1/employees?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.data.employees.length).toBeGreaterThan(0);
    });
    
    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/v1/employees?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.data.employees).toBeDefined();
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/employees?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
  
  describe('GET /api/v1/employees/:id', () => {
    it('should get employee by ID', async () => {
      // Get admin ID first
      const listResponse = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const employeeId = listResponse.body.data.employees[0].id;
      
      const response = await request(app)
        .get(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.id).toBe(employeeId);
    });
    
    it('should return 404 for non-existent employee', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/v1/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/employees/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/v1/employees/:id', () => {
    let employeeId;
    
    beforeEach(async () => {
      const listResponse = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      
      employeeId = listResponse.body.data.employees.find(e => e.role === 'employee')?.id;
    });
    
    it('should allow admin to update employee', async () => {
      const response = await request(app)
        .put(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          department: 'Engineering'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.name).toBe('Updated Name');
    });
    
    it('should allow HR to update employee', async () => {
      const response = await request(app)
        .put(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          department: 'Sales'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should reject employee updating another employee', async () => {
      const response = await request(app)
        .put(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Hacked Name'
        })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should prevent privilege escalation', async () => {
      const response = await request(app)
        .put(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          role: 'admin' // Trying to become admin
        })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('DELETE /api/v1/employees/:id', () => {
    let employeeId;
    
    beforeEach(async () => {
      const listResponse = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      
      employeeId = listResponse.body.data.employees.find(e => e.role === 'employee')?.id;
    });
    
    it('should allow admin to delete employee', async () => {
      const response = await request(app)
        .delete(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should reject HR from deleting employees', async () => {
      const response = await request(app)
        .delete(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject employee from deleting', async () => {
      const response = await request(app)
        .delete(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});


/**
 * Jest Global Setup
 * Runs once before all tests
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {
  console.log('\n🚀 Setting up test environment...\n');
  
  try {
    // Create test database connection
    const sequelize = new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'workorbit_test',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      logging: false
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run migrations
    console.log('📦 Running migrations...');
    const { execSync } = require('child_process');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed');
    
    await sequelize.close();
    
    console.log('\n✅ Test environment ready!\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
};


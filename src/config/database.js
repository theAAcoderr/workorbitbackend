const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workorbit_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  timezone: '+05:30', // IST timezone
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,      // Max connections (enterprise default)
    min: parseInt(process.env.DB_POOL_MIN) || 5,       // Min connections
    acquire: 30000,                                     // Max time to get connection (30s)
    idle: 10000,                                        // Max idle time (10s)
    evict: 1000                                         // Check for idle connections every 1s
  },
  dialectOptions: {
    // SSL configuration for cloud databases (Neon, AWS RDS, etc.)
    ssl: (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    useUTC: false,                                      // Use local time instead of UTC
    statement_timeout: 30000,                           // 30s query timeout
    idle_in_transaction_session_timeout: 10000          // 10s transaction timeout
  },
  // Retry logic for transient failures
  retry: {
    max: 3,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /ECONNREFUSED/,
      /EHOSTUNREACH/,
      /ETIMEDOUT/
    ]
  },
  // Benchmark queries in development
  benchmark: process.env.NODE_ENV === 'development'
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');

    // Note: We use migrations instead of sync for better control
    // Uncomment below only if you want to auto-sync models (not recommended with migrations)
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ force: true });
    //   console.log('⚠️  Database synchronized with FORCE (all data cleared)');
    // }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// For Sequelize CLI
module.exports = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'workorbit_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    dialectOptions: {
      ssl: (process.env.DB_SSL === 'true') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'workorbit_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  sequelize,
  connectDB
};
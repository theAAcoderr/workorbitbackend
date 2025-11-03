const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both DATABASE_URL (Render/Neon) and individual env vars
let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if available (Render, Neon, Heroku, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    timezone: '+05:30', // IST timezone
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      useUTC: false,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 10000
    },
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
    benchmark: process.env.NODE_ENV === 'development'
  });
} else {
  // Use individual environment variables (local development)
  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'workorbit_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    timezone: '+05:30',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    dialectOptions: {
      ssl: (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      useUTC: false,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 10000
    },
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
    benchmark: process.env.NODE_ENV === 'development'
  });
}

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
  development: process.env.DATABASE_URL ? {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  } : {
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
  production: process.env.DATABASE_URL ? {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  } : {
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
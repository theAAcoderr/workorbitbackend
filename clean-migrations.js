// Clean up SequelizeMeta table to remove ghost migrations
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false
});

async function cleanMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully');

    // Remove ghost migration entries
    const ghostMigrations = [
      '013_create_departments_teams.js',
      '014_create_forms_tables.js'
    ];

    for (const migration of ghostMigrations) {
      const result = await sequelize.query(
        `DELETE FROM "SequelizeMeta" WHERE name = :name`,
        {
          replacements: { name: migration },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      console.log(`Removed ghost migration: ${migration}`);
    }

    console.log('✅ Migration cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanMigrations();

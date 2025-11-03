require('dotenv').config();
const { sequelize } = require('../models');

/**
 * Migrates forms tables from INTEGER to UUID
 */

async function migrateForms() {
  try {
    console.log('🔄 Migrating Forms tables to UUID...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Drop existing tables (if any data exists, backup first!)
    console.log('⚠️  Dropping existing forms tables...');

    await sequelize.query('DROP TABLE IF EXISTS "form_responses" CASCADE;');
    console.log('  ✅ Dropped form_responses');

    await sequelize.query('DROP TABLE IF EXISTS "forms" CASCADE;');
    console.log('  ✅ Dropped forms\n');

    // Drop ENUM types
    await sequelize.query('DROP TYPE IF EXISTS "enum_forms_formType" CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS "enum_forms_status" CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS "enum_form_responses_status" CASCADE;');
    console.log('  ✅ Dropped ENUM types\n');

    console.log('✅ Migration complete! Tables dropped.');
    console.log('\n💡 Now run: node src/scripts/setup-forms-system.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

migrateForms();
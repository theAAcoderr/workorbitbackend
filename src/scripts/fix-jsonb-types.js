require('dotenv').config();
const { sequelize } = require('../models');

/**
 * Script to convert JSON columns to JSONB for PostgreSQL
 * This fixes the "@> operator does not exist" error
 */

async function fixJsonbTypes() {
  try {
    console.log('🔧 Converting JSON to JSONB columns...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Convert OnboardingTasks columns
    console.log('📋 Converting OnboardingTasks table:');

    await sequelize.query(`
      ALTER TABLE "OnboardingTasks"
      ALTER COLUMN "assignToRoles" TYPE JSONB USING "assignToRoles"::jsonb;
    `);
    console.log('  ✅ assignToRoles: JSON → JSONB');

    await sequelize.query(`
      ALTER TABLE "OnboardingTasks"
      ALTER COLUMN "resourceLinks" TYPE JSONB USING "resourceLinks"::jsonb;
    `);
    console.log('  ✅ resourceLinks: JSON → JSONB');

    // Convert Onboardings columns (if table exists)
    console.log('\n📋 Converting Onboardings table:');

    try {
      await sequelize.query(`
        ALTER TABLE "Onboardings"
        ALTER COLUMN "attachments" TYPE JSONB USING "attachments"::jsonb;
      `);
      console.log('  ✅ attachments: JSON → JSONB');
    } catch (error) {
      if (error.original?.code === '42P01') {
        console.log('  ⚠️  Onboardings table does not exist yet (will be created with JSONB)');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All columns converted successfully!');
    console.log('\n💡 The @> operator will now work correctly for JSON queries.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixJsonbTypes();
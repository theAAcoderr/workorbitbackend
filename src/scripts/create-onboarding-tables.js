require('dotenv').config();
const { sequelize, OnboardingTask, Onboarding } = require('../models');

/**
 * Creates OnboardingTasks and Onboardings tables if they don't exist
 */

async function createTables() {
  try {
    console.log('🔧 Creating onboarding tables...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check if OnboardingTasks exists
    console.log('📋 Checking OnboardingTasks table...');
    try {
      await OnboardingTask.findOne({ limit: 1 });
      console.log('  ✅ OnboardingTasks table already exists\n');
    } catch (error) {
      if (error.original?.code === '42P01') {
        console.log('  ⚠️  OnboardingTasks table does not exist, creating...');
        await OnboardingTask.sync();
        console.log('  ✅ OnboardingTasks table created\n');
      } else {
        throw error;
      }
    }

    // Check if Onboardings exists
    console.log('📋 Checking Onboardings table...');
    try {
      await Onboarding.findOne({ limit: 1 });
      console.log('  ✅ Onboardings table already exists\n');
    } catch (error) {
      if (error.original?.code === '42P01') {
        console.log('  ⚠️  Onboardings table does not exist, creating...');
        await Onboarding.sync();
        console.log('  ✅ Onboardings table created\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 All tables are ready!');

    // Verify table structures
    console.log('\n📊 Verifying table structures:');

    const [onboardingTaskColumns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'OnboardingTasks'
      ORDER BY ordinal_position;
    `);

    console.log(`\n  OnboardingTasks (${onboardingTaskColumns.length} columns):`);
    onboardingTaskColumns.slice(0, 5).forEach(col => {
      console.log(`    - ${col.column_name}: ${col.data_type}`);
    });
    console.log(`    ... and ${onboardingTaskColumns.length - 5} more`);

    const [onboardingColumns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Onboardings'
      ORDER BY ordinal_position;
    `);

    console.log(`\n  Onboardings (${onboardingColumns.length} columns):`);
    onboardingColumns.slice(0, 5).forEach(col => {
      console.log(`    - ${col.column_name}: ${col.data_type}`);
    });
    console.log(`    ... and ${onboardingColumns.length - 5} more`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

createTables();
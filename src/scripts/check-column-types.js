require('dotenv').config();
const { sequelize } = require('../models');

async function checkColumnTypes() {
  try {
    await sequelize.authenticate();
    console.log('📊 Checking column data types:\n');

    const [results] = await sequelize.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('OnboardingTasks', 'Onboardings')
        AND column_name IN ('assignToRoles', 'resourceLinks', 'attachments')
      ORDER BY table_name, column_name;
    `);

    results.forEach(row => {
      const icon = row.data_type === 'jsonb' ? '✅' : '❌';
      console.log(`${icon} ${row.table_name}.${row.column_name}: ${row.data_type.toUpperCase()}`);
    });

    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkColumnTypes();
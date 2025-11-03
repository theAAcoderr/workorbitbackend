require('dotenv').config();
const { sequelize, OnboardingTask } = require('../models');

async function cleanupDuplicates() {
  try {
    console.log('🧹 CLEANING UP DUPLICATE ONBOARDING TASKS\n');
    console.log('═'.repeat(60));

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find duplicates
    const duplicates = await sequelize.query(`
      SELECT
        "organizationId",
        title,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY "createdAt" ASC) as ids,
        ARRAY_AGG("createdAt" ORDER BY "createdAt" ASC) as dates
      FROM "OnboardingTasks"
      GROUP BY "organizationId", title
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate tasks found!\n');
      process.exit(0);
    }

    console.log(`Found ${duplicates.length} duplicate task groups:\n`);

    let totalDeleted = 0;

    for (const dup of duplicates) {
      console.log(`\n📋 "${dup.title}" (Organization: ${dup.organizationId})`);
      console.log(`   Appears ${dup.count} times`);

      // Keep the oldest (first created), delete the rest
      const idsToKeep = [dup.ids[0]];
      const idsToDelete = dup.ids.slice(1);

      console.log(`   Keeping: ${idsToKeep[0]} (created: ${new Date(dup.dates[0]).toISOString()})`);
      console.log(`   Deleting: ${idsToDelete.length} duplicate(s)`);

      for (let i = 0; i < idsToDelete.length; i++) {
        const id = idsToDelete[i];
        const date = dup.dates[i + 1];
        console.log(`     - ${id} (created: ${new Date(date).toISOString()})`);

        await OnboardingTask.destroy({
          where: { id }
        });
        totalDeleted++;
      }
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} duplicate tasks.\n`);

    // Verify
    console.log('📊 VERIFICATION:');
    console.log('─'.repeat(60));
    const remainingDuplicates = await sequelize.query(`
      SELECT
        "organizationId",
        title,
        COUNT(*) as count
      FROM "OnboardingTasks"
      GROUP BY "organizationId", title
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicates remaining!\n');
    } else {
      console.log(`⚠️  Still found ${remainingDuplicates.length} duplicates (run again if needed)\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

cleanupDuplicates();

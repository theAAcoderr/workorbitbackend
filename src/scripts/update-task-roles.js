require('dotenv').config();
const { sequelize, OnboardingTask } = require('../models');

/**
 * Update existing onboarding tasks to include all roles
 */

async function updateTaskRoles() {
  try {
    console.log('🔧 Updating task role assignments...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find all tasks
    const tasks = await OnboardingTask.findAll();

    if (tasks.length === 0) {
      console.log('⚠️  No tasks found to update');
      process.exit(0);
    }

    console.log(`📋 Found ${tasks.length} tasks to update\n`);

    // Update each task to include all roles
    const allRoles = ['employee', 'manager', 'hr', 'admin'];

    for (const task of tasks) {
      const oldRoles = task.assignToRoles || [];
      await task.update({
        assignToRoles: allRoles
      });

      console.log(`✅ Updated: "${task.title}"`);
      console.log(`   Old roles: [${oldRoles.join(', ')}]`);
      console.log(`   New roles: [${allRoles.join(', ')}]\n`);
    }

    console.log(`🎉 Successfully updated ${tasks.length} tasks!`);
    console.log('\n💡 All tasks are now visible to all user roles.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateTaskRoles();
require('dotenv').config();
const { sequelize, OnboardingTask } = require('../models');

async function verifyRoles() {
  try {
    await sequelize.authenticate();

    const tasks = await OnboardingTask.findAll({
      attributes: ['id', 'title', 'assignToRoles'],
      order: [['order', 'ASC']]
    });

    console.log('📋 Task Role Assignments:\n');
    tasks.forEach((t, i) => {
      const roles = t.assignToRoles || [];
      console.log(`${i+1}. ${t.title}`);
      console.log(`   Assigned to: [${roles.join(', ')}]\n`);
    });

    console.log(`✅ Total: ${tasks.length} tasks`);

    // Check if admin is included
    const adminTasks = tasks.filter(t => t.assignToRoles.includes('admin'));
    console.log(`\n👤 Tasks visible to admin role: ${adminTasks.length}/${tasks.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyRoles();
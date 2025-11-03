require('dotenv').config();
const { OnboardingTask, sequelize } = require('../models');

async function verify() {
  try {
    await sequelize.authenticate();

    const tasks = await OnboardingTask.findAll({
      attributes: ['id', 'title', 'category', 'priority', 'mandatory', 'isActive'],
      order: [['order', 'ASC']]
    });

    console.log('📋 Onboarding Tasks in Database:\n');
    tasks.forEach((t, i) => {
      const mandatory = t.mandatory ? ' [MANDATORY]' : '';
      console.log(`${i+1}. [${t.priority.toUpperCase()}] ${t.title} (${t.category})${mandatory}`);
    });

    console.log(`\n✅ Total: ${tasks.length} tasks`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verify();
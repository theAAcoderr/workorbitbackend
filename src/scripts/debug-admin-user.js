require('dotenv').config();
const { sequelize, User, Organization, OnboardingTask } = require('../models');

async function debugAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('🔍 Debugging admin user and tasks...\n');

    // Find admin user
    const admin = await User.findOne({
      where: { email: 'admin@gmail.com' }
    });

    if (!admin) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('👤 Admin User:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Organization ID: ${admin.organizationId}`);
    console.log(`   Status: ${admin.status}\n`);

    // Find admin's organization
    const org = await Organization.findByPk(admin.organizationId);
    console.log('🏢 Organization:');
    console.log(`   ID: ${org.id}`);
    console.log(`   Name: ${org.name}\n`);

    // Find tasks in admin's organization
    const tasksInOrg = await OnboardingTask.findAll({
      where: { organizationId: admin.organizationId }
    });

    console.log(`📋 Tasks in admin's organization: ${tasksInOrg.length}`);
    tasksInOrg.forEach((task, i) => {
      const roles = task.assignToRoles || [];
      const hasAdmin = roles.includes('admin');
      console.log(`   ${i+1}. ${task.title}`);
      console.log(`      Roles: [${roles.join(', ')}] ${hasAdmin ? '✅' : '❌'}`);
      console.log(`      Active: ${task.isActive ? '✅' : '❌'}`);
    });

    // Find ALL tasks in database
    console.log('\n📊 All tasks in database:');
    const allTasks = await OnboardingTask.findAll({
      attributes: ['id', 'organizationId', 'title', 'isActive', 'assignToRoles']
    });

    console.log(`   Total: ${allTasks.length} tasks\n`);
    allTasks.forEach((task, i) => {
      const matchesOrg = task.organizationId === admin.organizationId ? '✅' : '❌';
      console.log(`   ${i+1}. ${task.title}`);
      console.log(`      Org ID: ${task.organizationId} ${matchesOrg}`);
      console.log(`      Active: ${task.isActive}`);
      console.log(`      Roles: [${(task.assignToRoles || []).join(', ')}]`);
    });

    // Test the query that the API uses
    console.log('\n🔎 Testing API query:');
    const { Op } = require('sequelize');
    const apiTasks = await OnboardingTask.findAll({
      where: {
        organizationId: admin.organizationId,
        isActive: true,
        assignToRoles: {
          [Op.contains]: [admin.role]
        }
      }
    });

    console.log(`   Result: ${apiTasks.length} tasks found`);
    if (apiTasks.length === 0) {
      console.log('   ❌ No tasks match the query!');
    } else {
      apiTasks.forEach((task, i) => {
        console.log(`   ${i+1}. ${task.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

debugAdminUser();
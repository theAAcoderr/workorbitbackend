require('dotenv').config();
const { sequelize, Organization, User, OnboardingTask, Onboarding } = require('../models');

async function diagnose() {
  try {
    console.log('🔍 ONBOARDING SYSTEM DIAGNOSTIC\n');
    console.log('═'.repeat(60));

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Check Organizations
    console.log('📊 ORGANIZATIONS:');
    console.log('─'.repeat(60));
    const organizations = await Organization.findAll({
      attributes: ['id', 'name', 'createdAt']
    });

    if (organizations.length === 0) {
      console.log('❌ No organizations found!');
      process.exit(1);
    }

    organizations.forEach((org, i) => {
      console.log(`${i + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Created: ${org.createdAt.toISOString().split('T')[0]}`);
    });
    console.log('');

    // 2. Check Users per Organization
    console.log('👥 USERS PER ORGANIZATION:');
    console.log('─'.repeat(60));
    for (const org of organizations) {
      const users = await User.findAll({
        where: { organizationId: org.id },
        attributes: ['id', 'name', 'email', 'role']
      });
      console.log(`\n${org.name} (${org.id}):`);
      if (users.length === 0) {
        console.log('  ⚠️  No users found');
      } else {
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }
    }
    console.log('\n');

    // 3. Check OnboardingTasks per Organization
    console.log('📋 ONBOARDING TASKS PER ORGANIZATION:');
    console.log('─'.repeat(60));
    for (const org of organizations) {
      const tasks = await OnboardingTask.findAll({
        where: { organizationId: org.id },
        attributes: ['id', 'title', 'category', 'assignToRoles', 'isActive', 'mandatory'],
        order: [['order', 'ASC']]
      });

      console.log(`\n${org.name} (${org.id}):`);
      if (tasks.length === 0) {
        console.log('  ❌ NO TASKS FOUND - THIS IS THE PROBLEM!');
      } else {
        console.log(`  ✅ ${tasks.length} tasks found:`);
        tasks.forEach((task, i) => {
          const roles = Array.isArray(task.assignToRoles) ? task.assignToRoles.join(', ') : task.assignToRoles;
          const status = task.isActive ? '✓' : '✗';
          const mandatory = task.mandatory ? '[MANDATORY]' : '[OPTIONAL]';
          console.log(`  ${i + 1}. ${status} ${task.title} ${mandatory}`);
          console.log(`     Category: ${task.category} | Roles: ${roles}`);
        });
      }
    }
    console.log('\n');

    // 4. Check Onboarding Progress Records
    console.log('📈 ONBOARDING PROGRESS RECORDS:');
    console.log('─'.repeat(60));
    const progressRecords = await Onboarding.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'organizationId']
        },
        {
          model: OnboardingTask,
          as: 'task',
          attributes: ['title']
        }
      ]
    });

    if (progressRecords.length === 0) {
      console.log('⚠️  No progress records found (will be auto-created on first API call)');
    } else {
      console.log(`Found ${progressRecords.length} progress records:\n`);
      const groupedByUser = {};
      progressRecords.forEach(record => {
        const userKey = record.user.email;
        if (!groupedByUser[userKey]) {
          groupedByUser[userKey] = {
            user: record.user,
            tasks: []
          };
        }
        groupedByUser[userKey].tasks.push({
          title: record.task.title,
          completed: record.completed
        });
      });

      Object.entries(groupedByUser).forEach(([email, data]) => {
        const completed = data.tasks.filter(t => t.completed).length;
        const total = data.tasks.length;
        console.log(`${data.user.name} (${email}):`);
        console.log(`  Progress: ${completed}/${total} tasks (${Math.round(completed/total*100)}%)`);
        data.tasks.forEach(task => {
          console.log(`  ${task.completed ? '✓' : '○'} ${task.title}`);
        });
        console.log('');
      });
    }

    // 5. Identify Issues
    console.log('\n');
    console.log('🔧 DIAGNOSIS SUMMARY:');
    console.log('═'.repeat(60));

    let issuesFound = false;

    for (const org of organizations) {
      const tasks = await OnboardingTask.count({ where: { organizationId: org.id } });
      const users = await User.count({ where: { organizationId: org.id } });

      if (tasks === 0 && users > 0) {
        console.log(`❌ ISSUE: Organization "${org.name}" has ${users} users but NO onboarding tasks!`);
        console.log(`   This is why mobile app shows "No onboarding tasks"`);
        console.log(`   Fix: Run seed script for this organization`);
        console.log(`   Organization ID: ${org.id}\n`);
        issuesFound = true;
      }
    }

    // Check for duplicate tasks
    const duplicateCheck = await sequelize.query(`
      SELECT
        "organizationId",
        title,
        COUNT(*) as count
      FROM "OnboardingTasks"
      GROUP BY "organizationId", title
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateCheck.length > 0) {
      console.log('⚠️  DUPLICATE TASKS FOUND:');
      duplicateCheck.forEach(dup => {
        console.log(`   "${dup.title}" appears ${dup.count} times in org ${dup.organizationId}`);
      });
      issuesFound = true;
      console.log('');
    }

    if (!issuesFound) {
      console.log('✅ No critical issues found!');
      console.log('   All organizations have onboarding tasks configured.');
    }

    console.log('\n');
    console.log('📝 NEXT STEPS:');
    console.log('─'.repeat(60));
    console.log('1. If any organization is missing tasks, run:');
    console.log('   node src/scripts/seed-onboarding-for-org.js <ORG_ID>');
    console.log('');
    console.log('2. If duplicates exist, run:');
    console.log('   node src/scripts/cleanup-duplicate-tasks.js');
    console.log('');
    console.log('3. To seed all organizations at once:');
    console.log('   node src/scripts/seed-all-organizations.js');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

diagnose();

require('dotenv').config();
const { sequelize, Organization, User, OnboardingTask } = require('../models');

const defaultTasks = [
  {
    title: 'Complete Your Profile',
    description: 'Update your personal information and contact details',
    category: 'Profile',
    priority: 'high',
    order: 1,
    mandatory: true,
    dueInDays: 3,
    assignToRoles: ['employee', 'manager', 'hr', 'admin'],
    instructions: 'Go to Settings > Profile and fill all required fields',
    resourceLinks: []
  },
  {
    title: 'Upload Required Documents',
    description: 'Upload ID proof and address verification documents',
    category: 'Documents',
    priority: 'high',
    order: 2,
    mandatory: true,
    dueInDays: 7,
    assignToRoles: ['employee', 'manager'],
    instructions: 'Navigate to Documents section and upload required files',
    resourceLinks: []
  },
  {
    title: 'Complete Compliance Training',
    description: 'Complete mandatory workplace compliance training',
    category: 'Training',
    priority: 'high',
    order: 3,
    mandatory: true,
    dueInDays: 14,
    assignToRoles: ['employee', 'manager', 'hr'],
    instructions: 'Access training portal and complete all modules',
    resourceLinks: []
  },
  {
    title: 'Set Up Your Workspace',
    description: 'Configure your workstation and install necessary software',
    category: 'Setup',
    priority: 'medium',
    order: 4,
    mandatory: false,
    dueInDays: 5,
    assignToRoles: ['employee', 'manager'],
    instructions: 'Follow IT setup guide to configure your workspace',
    resourceLinks: []
  },
  {
    title: 'Review Company Policies',
    description: 'Read and acknowledge company policies and handbook',
    category: 'Compliance',
    priority: 'medium',
    order: 5,
    mandatory: true,
    dueInDays: 10,
    assignToRoles: ['employee', 'manager', 'hr', 'admin'],
    instructions: 'Review employee handbook and sign acknowledgment',
    resourceLinks: []
  },
  {
    title: 'Schedule 1-on-1 with Manager',
    description: 'Set up an introductory meeting with your direct manager',
    category: 'General',
    priority: 'high',
    order: 6,
    mandatory: true,
    dueInDays: 3,
    assignToRoles: ['employee'],
    instructions: 'Use the Meetings module to schedule a 1-on-1 with your manager',
    resourceLinks: []
  },
  {
    title: 'Complete Security Training',
    description: 'Learn about data security and privacy best practices',
    category: 'Training',
    priority: 'high',
    order: 7,
    mandatory: true,
    dueInDays: 7,
    assignToRoles: ['employee', 'manager', 'hr', 'admin'],
    instructions: 'Complete the security awareness training module',
    resourceLinks: []
  },
  {
    title: 'Set Up Time Tracking',
    description: 'Learn how to log your work hours and attendance',
    category: 'Setup',
    priority: 'medium',
    order: 8,
    mandatory: false,
    dueInDays: 5,
    assignToRoles: ['employee', 'manager'],
    instructions: 'Review the time tracking guide and practice checking in/out',
    resourceLinks: []
  }
];

async function seedAllOrganizations() {
  try {
    console.log('🌱 SEEDING ONBOARDING TASKS FOR ALL ORGANIZATIONS\n');
    console.log('═'.repeat(60));

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const organizations = await Organization.findAll({
      attributes: ['id', 'name']
    });

    if (organizations.length === 0) {
      console.error('❌ No organizations found in database!');
      process.exit(1);
    }

    console.log(`Found ${organizations.length} organization(s)\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const org of organizations) {
      console.log(`\n📋 Processing: ${org.name} (${org.id})`);
      console.log('─'.repeat(60));

      // Check existing tasks
      const existingTasks = await OnboardingTask.count({
        where: { organizationId: org.id }
      });

      if (existingTasks > 0) {
        console.log(`⚠️  ${existingTasks} tasks already exist - SKIPPING`);
        totalSkipped += existingTasks;
        continue;
      }

      // Find an admin user for this org to be the creator
      const admin = await User.findOne({
        where: {
          organizationId: org.id,
          role: 'admin'
        }
      });

      // If no admin, find any user
      const creator = admin || await User.findOne({
        where: { organizationId: org.id }
      });

      if (!creator) {
        console.log(`⚠️  No users found for this organization - SKIPPING`);
        continue;
      }

      console.log(`👤 Creator: ${creator.email} (${creator.role})`);

      // Create tasks
      let created = 0;
      for (const task of defaultTasks) {
        await OnboardingTask.create({
          ...task,
          organizationId: org.id,
          createdBy: creator.id,
          isActive: true
        });
        console.log(`  ✅ ${task.title}`);
        created++;
      }

      totalCreated += created;
      console.log(`\n✅ Created ${created} tasks for ${org.name}`);
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🎉 SEEDING COMPLETE!\n');
    console.log(`Total tasks created: ${totalCreated}`);
    console.log(`Total tasks skipped: ${totalSkipped}`);
    console.log('');

    // Summary per organization
    console.log('📊 SUMMARY BY ORGANIZATION:');
    console.log('─'.repeat(60));
    for (const org of organizations) {
      const taskCount = await OnboardingTask.count({
        where: { organizationId: org.id }
      });
      const userCount = await User.count({
        where: { organizationId: org.id }
      });
      console.log(`${org.name}:`);
      console.log(`  Tasks: ${taskCount}`);
      console.log(`  Users: ${userCount}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedAllOrganizations();

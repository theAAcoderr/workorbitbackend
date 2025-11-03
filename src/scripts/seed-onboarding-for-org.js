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

async function seedForOrganization() {
  try {
    const orgId = process.argv[2];

    if (!orgId) {
      console.log('\n❌ Usage: node seed-onboarding-for-org.js <ORGANIZATION_ID>\n');
      console.log('Example:');
      console.log('  node src/scripts/seed-onboarding-for-org.js fb1ed0f2-f928-4ad4-8783-2ddcf47ee9dc\n');
      process.exit(1);
    }

    console.log(`🌱 SEEDING ONBOARDING TASKS FOR ORGANIZATION: ${orgId}\n`);
    console.log('═'.repeat(60));

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find organization
    const org = await Organization.findByPk(orgId);
    if (!org) {
      console.error(`❌ Organization not found: ${orgId}\n`);

      // Show available organizations
      console.log('Available organizations:');
      const orgs = await Organization.findAll({ attributes: ['id', 'name'] });
      orgs.forEach(o => console.log(`  ${o.id} - ${o.name}`));
      console.log('');
      process.exit(1);
    }

    console.log(`📋 Organization: ${org.name}`);

    // Check existing tasks
    const existing = await OnboardingTask.count({
      where: { organizationId: org.id }
    });

    if (existing > 0) {
      console.log(`\n⚠️  ${existing} tasks already exist for this organization.`);
      console.log('Do you want to:');
      console.log('  1. Skip (default)');
      console.log('  2. Add anyway (may create duplicates)');
      console.log('  3. Delete existing and recreate');
      console.log('\nSkipping to be safe. Use cleanup-duplicate-tasks.js if needed.\n');
      process.exit(0);
    }

    // Find creator (admin user or any user)
    const admin = await User.findOne({
      where: { organizationId: org.id, role: 'admin' }
    });

    const creator = admin || await User.findOne({
      where: { organizationId: org.id }
    });

    if (!creator) {
      console.error(`\n❌ No users found for organization: ${org.name}`);
      console.log('Cannot create tasks without a creator user.\n');
      process.exit(1);
    }

    console.log(`👤 Creator: ${creator.email} (${creator.role})\n`);

    // Create tasks
    console.log('Creating tasks:');
    console.log('─'.repeat(60));
    for (const task of defaultTasks) {
      await OnboardingTask.create({
        ...task,
        organizationId: org.id,
        createdBy: creator.id,
        isActive: true
      });
      const roles = task.assignToRoles.join(', ');
      console.log(`✅ ${task.title}`);
      console.log(`   Category: ${task.category} | Roles: ${roles} | Due: ${task.dueInDays} days`);
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log(`🎉 Successfully created ${defaultTasks.length} onboarding tasks!\n`);
    console.log('📱 Users in the mobile app should now see onboarding tasks.');
    console.log('   (They may need to pull-to-refresh or restart the app)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedForOrganization();

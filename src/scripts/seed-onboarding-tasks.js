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
    assignToRoles: ['employee'],
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
    assignToRoles: ['employee'],
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
    assignToRoles: ['employee'],
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
    assignToRoles: ['employee'],
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
    assignToRoles: ['employee'],
    instructions: 'Review employee handbook and sign acknowledgment',
    resourceLinks: []
  }
];

async function seed() {
  try {
    console.log('🌱 Seeding onboarding tasks...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const org = await Organization.findOne();
    if (!org) {
      console.error('❌ No organization found');
      process.exit(1);
    }

    const admin = await User.findOne({ where: { organizationId: org.id, role: 'admin' } });
    console.log(`📋 Organization: ${org.name}`);
    console.log(`👤 Creator: ${admin ? admin.email : 'None'}\n`);

    const existing = await OnboardingTask.count({ where: { organizationId: org.id } });
    if (existing > 0) {
      console.log(`⚠️  ${existing} tasks already exist. Skipping.\n`);
      process.exit(0);
    }

    for (const task of defaultTasks) {
      await OnboardingTask.create({
        ...task,
        organizationId: org.id,
        createdBy: admin?.id,
        isActive: true
      });
      console.log(`✅ Created: ${task.title}`);
    }

    console.log(`\n🎉 Created ${defaultTasks.length} tasks successfully!\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
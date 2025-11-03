const { sequelize } = require('../config/database');
const { Op, DataTypes } = require('sequelize');
const SystemActivityLog = require('../models/SystemActivityLog');
const User = require('../models/User');
const Organization = require('../models/Organization');
const crypto = require('crypto');

// Generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Setup System Activity Logs table and relationships
 */
async function setupSystemActivityLogs() {
  try {
    console.log('Setting up System Activity Logs...');

    // Define relationships
    SystemActivityLog.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });

    SystemActivityLog.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });

    // Sync table (create if doesn't exist)
    await SystemActivityLog.sync({ alter: true });
    console.log('✓ SystemActivityLog table created/updated');

    // Find a user with an organization to create sample logs
    const userWithOrg = await User.findOne({
      where: {
        organizationId: { [Op.ne]: null }
      }
    });

    if (!userWithOrg || !userWithOrg.organizationId) {
      console.log('⚠  No user with organization found. Skipping sample data creation.');
      return;
    }

    const organizationId = userWithOrg.organizationId;

    // Get all users in the organization
    const orgUsers = await User.findAll({
      where: { organizationId },
      limit: 5
    });

    console.log(`Found ${orgUsers.length} users in organization ${organizationId}`);

    // Create sample activity logs
    const sampleActivities = [
      {
        action: 'login',
        description: 'User logged in successfully',
        entityType: 'auth',
        details: { platform: 'web', browser: 'Chrome' }
      },
      {
        action: 'create',
        description: 'Created new form: Employee Feedback Survey',
        entityType: 'form',
        details: { formType: 'survey', fieldsCount: 5 }
      },
      {
        action: 'update',
        description: 'Updated employee profile information',
        entityType: 'user',
        details: { fields: ['name', 'email', 'phone'] }
      },
      {
        action: 'check-in',
        description: 'Checked in for work',
        entityType: 'attendance',
        details: { location: 'Office', method: 'mobile' }
      },
      {
        action: 'leave-request',
        description: 'Submitted leave request for vacation',
        entityType: 'leave',
        details: { type: 'vacation', days: 5 }
      },
      {
        action: 'create',
        description: 'Created new project: Website Redesign',
        entityType: 'project',
        details: { deadline: '2025-12-31', priority: 'high' }
      },
      {
        action: 'update',
        description: 'Updated task status to completed',
        entityType: 'task',
        details: { status: 'completed', taskName: 'Homepage Design' }
      },
      {
        action: 'meeting-created',
        description: 'Scheduled team meeting for tomorrow',
        entityType: 'meeting',
        details: { attendees: 5, duration: '1 hour' }
      },
      {
        action: 'delete',
        description: 'Deleted draft announcement',
        entityType: 'announcement',
        details: { title: 'Holiday Notice' }
      },
      {
        action: 'check-out',
        description: 'Checked out from work',
        entityType: 'attendance',
        details: { workHours: 8.5 }
      }
    ];

    // Create logs for multiple users over the past week
    const logsCreated = [];
    for (let i = 0; i < 30; i++) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomActivity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      const log = await SystemActivityLog.create({
        userId: randomUser.id,
        organizationId,
        action: randomActivity.action,
        entityType: randomActivity.entityType,
        entityId: generateUUID(), // Random UUID
        description: randomActivity.description,
        details: randomActivity.details,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt,
        updatedAt: createdAt
      });

      logsCreated.push(log.id);
    }

    console.log(`✓ Created ${logsCreated.length} sample activity logs`);
    console.log('\n✅ System Activity Logs setup complete!');
    console.log(`\nSample logs created for organization: ${organizationId}`);
    console.log(`Total users: ${orgUsers.length}`);
    console.log(`Total logs: ${logsCreated.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error setting up system activity logs:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSystemActivityLogs();
}

module.exports = { setupSystemActivityLogs };
/**
 * Seed Test Compliance Data
 * Creates sample compliance items with different expiry dates for testing
 */

const { Compliance, User, Organization } = require('../models');

async function seedComplianceData() {
  try {
    console.log('🌱 Starting compliance data seeding...');

    // Find first organization and user
    const organization = await Organization.findOne();
    const user = await User.findOne({ where: { role: 'admin' } });

    if (!organization || !user) {
      console.error('❌ No organization or admin user found. Please create them first.');
      return;
    }

    console.log(`✅ Found organization: ${organization.name}`);
    console.log(`✅ Found user: ${user.name}`);

    // Clear existing compliance items (optional)
    await Compliance.destroy({ where: { organizationId: organization.id } });
    console.log('🗑️  Cleared existing compliance items');

    const today = new Date();

    // Create compliance items with different expiry dates
    const complianceItems = [
      // ACTIVE (expires in 60 days)
      {
        organizationId: organization.id,
        title: 'ISO 9001 Certification',
        description: 'Quality Management System Certification',
        type: 'Certification',
        category: 'Quality',
        status: 'Active',
        issueDate: new Date(today.getFullYear(), today.getMonth() - 12, 1),
        expiryDate: new Date(today.getFullYear(), today.getMonth() + 2, 1), // 60 days
        reminderDays: 30,
        issuingAuthority: 'ISO',
        certificateNumber: 'ISO-2024-001',
        createdBy: user.id,
      },
      // ACTIVE (expires in 90 days)
      {
        organizationId: organization.id,
        title: 'Business License',
        description: 'General Business Operating License',
        type: 'License',
        category: 'Legal',
        status: 'Active',
        issueDate: new Date(today.getFullYear(), today.getMonth() - 6, 15),
        expiryDate: new Date(today.getFullYear(), today.getMonth() + 3, 15), // 90 days
        reminderDays: 30,
        issuingAuthority: 'State Business Bureau',
        certificateNumber: 'BL-2024-456',
        createdBy: user.id,
      },
      // EXPIRING SOON (expires in 15 days)
      {
        organizationId: organization.id,
        title: 'Fire Safety Certificate',
        description: 'Annual Fire Safety Inspection Certificate',
        type: 'Certification',
        category: 'Safety',
        status: 'Expiring Soon',
        issueDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15), // 15 days
        reminderDays: 30,
        issuingAuthority: 'Fire Department',
        certificateNumber: 'FS-2024-789',
        notes: 'Renewal inspection scheduled for next week',
        createdBy: user.id,
      },
      // EXPIRING SOON (expires in 20 days)
      {
        organizationId: organization.id,
        title: 'Employee Health Insurance',
        description: 'Group Health Insurance Policy',
        type: 'Insurance',
        category: 'HR',
        status: 'Expiring Soon',
        issueDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20), // 20 days
        reminderDays: 30,
        issuingAuthority: 'Health Insurance Corp',
        certificateNumber: 'HI-2024-321',
        notes: 'Need to negotiate renewal terms',
        createdBy: user.id,
      },
      // EXPIRING SOON (expires in 25 days)
      {
        organizationId: organization.id,
        title: 'Data Protection Training',
        description: 'GDPR Compliance Training Certification',
        type: 'Training',
        category: 'Security',
        status: 'Expiring Soon',
        issueDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25), // 25 days
        reminderDays: 30,
        issuingAuthority: 'Data Protection Authority',
        certificateNumber: 'DPT-2024-555',
        createdBy: user.id,
      },
      // EXPIRED (expired 5 days ago)
      {
        organizationId: organization.id,
        title: 'Annual Audit Report',
        description: 'Financial Audit Compliance',
        type: 'Audit',
        category: 'Finance',
        status: 'Expired',
        issueDate: new Date(today.getFullYear() - 1, today.getMonth() - 1, today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5), // 5 days ago
        reminderDays: 30,
        issuingAuthority: 'External Auditors LLC',
        certificateNumber: 'AUD-2024-999',
        notes: 'URGENT: Schedule renewal audit immediately',
        createdBy: user.id,
      },
      // EXPIRED (expired 10 days ago)
      {
        organizationId: organization.id,
        title: 'Workplace Safety Policy',
        description: 'OSHA Workplace Safety Compliance',
        type: 'Policy',
        category: 'Safety',
        status: 'Expired',
        issueDate: new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10), // 10 days ago
        reminderDays: 30,
        issuingAuthority: 'OSHA',
        certificateNumber: 'OSHA-2024-111',
        notes: 'Action required: Update policy and resubmit',
        createdBy: user.id,
      },
      // EXPIRED (expired 30 days ago)
      {
        organizationId: organization.id,
        title: 'IT Security Certification',
        description: 'Cybersecurity Framework Certification',
        type: 'Certification',
        category: 'IT',
        status: 'Expired',
        issueDate: new Date(today.getFullYear() - 1, today.getMonth() - 1, today.getDate()),
        expiryDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()), // 30 days ago
        reminderDays: 30,
        issuingAuthority: 'Cybersecurity Institute',
        certificateNumber: 'CYB-2024-888',
        notes: 'Critical: Renew to maintain compliance',
        createdBy: user.id,
      },
    ];

    // Insert all compliance items
    for (const item of complianceItems) {
      await Compliance.create(item);
      console.log(`✅ Created: ${item.title} (${item.status})`);
    }

    console.log('\n🎉 Successfully seeded compliance test data!');
    console.log(`📊 Created ${complianceItems.length} compliance items:`);
    console.log(`   - Active: 2 items`);
    console.log(`   - Expiring Soon: 3 items`);
    console.log(`   - Expired: 3 items`);
    console.log('\n💡 Now open the Compliance Tracking screen in your app to see the data!');

  } catch (error) {
    console.error('❌ Error seeding compliance data:', error);
  } finally {
    process.exit();
  }
}

// Run the seeder
seedComplianceData();

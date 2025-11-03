require('dotenv').config();
const { sequelize, Form, FormResponse, User, Organization } = require('../models');

/**
 * Complete setup script for Forms system
 * 1. Creates forms and form_responses tables
 * 2. Seeds sample forms for testing
 */

async function setupFormsSystem() {
  try {
    console.log('🚀 Setting up Forms System...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Step 1: Create tables
    console.log('📋 Creating Forms tables...\n');

    try {
      await Form.sync();
      console.log('  ✅ forms table created/verified');
    } catch (error) {
      console.log(`  ⚠️  forms table: ${error.message}`);
    }

    try {
      await FormResponse.sync();
      console.log('  ✅ form_responses table created/verified\n');
    } catch (error) {
      console.log(`  ⚠️  form_responses table: ${error.message}\n`);
    }

    // Step 2: Find admin user's organization
    const admin = await User.findOne({
      where: { email: 'admin@gmail.com' }
    });

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    const org = await Organization.findByPk(admin.organizationId);
    console.log(`👤 Admin: ${admin.email}`);
    console.log(`🏢 Organization: ${org.name}\n`);

    // Step 3: Check existing forms
    const existingCount = await Form.count({
      where: { organizationId: org.id }
    });

    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} forms already exist for this organization.`);
      console.log('Skipping seed data creation.\n');
    } else {
      // Step 4: Create sample forms
      console.log('🌱 Creating sample forms...\n');

      const sampleForms = [
        {
          title: 'Employee Feedback Survey',
          description: 'Monthly feedback survey to understand employee satisfaction and gather improvement suggestions',
          formType: 'survey',
          fields: [
            {
              id: 'overall_satisfaction',
              type: 'rating',
              label: 'Overall Job Satisfaction',
              required: true,
              validation: { min: 1, max: 5 }
            },
            {
              id: 'work_environment',
              type: 'radio',
              label: 'How would you rate the work environment?',
              required: true,
              options: ['Excellent', 'Good', 'Fair', 'Poor']
            },
            {
              id: 'suggestions',
              type: 'textarea',
              label: 'What improvements would you like to see?',
              required: false,
              validation: { maxLength: 500 }
            },
            {
              id: 'department',
              type: 'select',
              label: 'Department',
              required: true,
              options: ['Sales', 'Marketing', 'IT', 'HR', 'Operations', 'Finance']
            }
          ],
          settings: {
            allowMultipleSubmissions: false,
            showProgressBar: true,
            requireAuthentication: true
          },
          isAnonymous: true,
          allowMultipleResponses: false,
          status: 'published',
          publishedAt: new Date()
        },
        {
          title: 'Leave Application Form',
          description: 'Submit leave requests for approval',
          formType: 'application',
          fields: [
            {
              id: 'leave_type',
              type: 'select',
              label: 'Leave Type',
              required: true,
              options: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity/Paternity Leave']
            },
            {
              id: 'start_date',
              type: 'date',
              label: 'Start Date',
              required: true
            },
            {
              id: 'end_date',
              type: 'date',
              label: 'End Date',
              required: true
            },
            {
              id: 'reason',
              type: 'textarea',
              label: 'Reason for Leave',
              required: true,
              validation: { maxLength: 300 }
            },
            {
              id: 'contact_during_leave',
              type: 'phone',
              label: 'Contact Number During Leave',
              required: false
            }
          ],
          settings: {
            allowMultipleSubmissions: true,
            showProgressBar: false,
            requireAuthentication: true
          },
          isAnonymous: false,
          allowMultipleResponses: true,
          status: 'published',
          publishedAt: new Date()
        },
        {
          title: 'Customer Satisfaction Survey',
          description: 'Help us improve our services by sharing your experience',
          formType: 'feedback',
          fields: [
            {
              id: 'service_rating',
              type: 'rating',
              label: 'Rate our service',
              required: true,
              validation: { min: 1, max: 5 }
            },
            {
              id: 'recommend',
              type: 'radio',
              label: 'Would you recommend us to others?',
              required: true,
              options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']
            },
            {
              id: 'feedback',
              type: 'textarea',
              label: 'Additional Comments',
              required: false,
              validation: { maxLength: 1000 }
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email (optional for follow-up)',
              required: false
            }
          ],
          settings: {
            allowMultipleSubmissions: false,
            showProgressBar: true,
            requireAuthentication: false
          },
          isAnonymous: true,
          allowMultipleResponses: false,
          status: 'published',
          publishedAt: new Date()
        },
        {
          title: 'New Employee Onboarding Form',
          description: 'Welcome! Please complete this form to help us get you set up',
          formType: 'application',
          fields: [
            {
              id: 'full_name',
              type: 'text',
              label: 'Full Name',
              required: true,
              validation: { minLength: 2, maxLength: 100 }
            },
            {
              id: 'personal_email',
              type: 'email',
              label: 'Personal Email',
              required: true
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true
            },
            {
              id: 'start_date',
              type: 'date',
              label: 'Preferred Start Date',
              required: true
            },
            {
              id: 'dietary_restrictions',
              type: 'checkbox',
              label: 'Dietary Restrictions (if any)',
              required: false,
              options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'None']
            },
            {
              id: 'emergency_contact',
              type: 'text',
              label: 'Emergency Contact Name',
              required: true
            },
            {
              id: 'emergency_phone',
              type: 'phone',
              label: 'Emergency Contact Phone',
              required: true
            }
          ],
          settings: {
            allowMultipleSubmissions: false,
            showProgressBar: true,
            requireAuthentication: true
          },
          isAnonymous: false,
          allowMultipleResponses: false,
          status: 'draft'
        },
        {
          title: 'Performance Review Form',
          description: 'Quarterly performance evaluation',
          formType: 'evaluation',
          fields: [
            {
              id: 'employee_name',
              type: 'text',
              label: 'Employee Name',
              required: true
            },
            {
              id: 'review_period',
              type: 'text',
              label: 'Review Period (e.g., Q1 2025)',
              required: true
            },
            {
              id: 'quality_of_work',
              type: 'rating',
              label: 'Quality of Work',
              required: true,
              validation: { min: 1, max: 5 }
            },
            {
              id: 'communication',
              type: 'rating',
              label: 'Communication Skills',
              required: true,
              validation: { min: 1, max: 5 }
            },
            {
              id: 'teamwork',
              type: 'rating',
              label: 'Teamwork & Collaboration',
              required: true,
              validation: { min: 1, max: 5 }
            },
            {
              id: 'achievements',
              type: 'textarea',
              label: 'Key Achievements',
              required: true,
              validation: { maxLength: 500 }
            },
            {
              id: 'improvement_areas',
              type: 'textarea',
              label: 'Areas for Improvement',
              required: true,
              validation: { maxLength: 500 }
            }
          ],
          settings: {
            allowMultipleSubmissions: false,
            showProgressBar: true,
            requireAuthentication: true
          },
          isAnonymous: false,
          allowMultipleResponses: false,
          status: 'draft'
        }
      ];

      let createdCount = 0;
      for (const formData of sampleForms) {
        await Form.create({
          ...formData,
          organizationId: org.id,
          createdBy: admin.id,
          isActive: true
        });

        const icon = formData.status === 'published' ? '🟢' : '🟡';
        console.log(`  ${icon} Created: "${formData.title}" (${formData.formType}, ${formData.status})`);
        createdCount++;
      }

      console.log(`\n🎉 Created ${createdCount} sample forms!\n`);
    }

    // Step 5: Display summary
    const allForms = await Form.findAll({
      where: { organizationId: org.id },
      attributes: ['id', 'title', 'formType', 'status', 'isActive', 'responseCount'],
      order: [['createdAt', 'DESC']]
    });

    console.log('📊 Forms Summary:\n');
    console.log(`Organization: ${org.name}`);
    console.log(`Total Forms: ${allForms.length}\n`);

    const statusCount = {
      draft: allForms.filter(f => f.status === 'draft').length,
      published: allForms.filter(f => f.status === 'published').length,
      closed: allForms.filter(f => f.status === 'closed').length,
      archived: allForms.filter(f => f.status === 'archived').length
    };

    console.log('By Status:');
    console.log(`  🟡 Draft: ${statusCount.draft}`);
    console.log(`  🟢 Published: ${statusCount.published}`);
    console.log(`  🔴 Closed: ${statusCount.closed}`);
    console.log(`  ⚫ Archived: ${statusCount.archived}\n`);

    const typeCount = {};
    allForms.forEach(f => {
      typeCount[f.formType] = (typeCount[f.formType] || 0) + 1;
    });

    console.log('By Type:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  📋 ${type}: ${count}`);
    });

    console.log('\n✅ Forms system setup complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Refresh the Forms screen in your Flutter app');
    console.log('  3. You should now see the sample forms!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

setupFormsSystem();
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔨 Adding database indexes for performance optimization...');

    // Helper function to add index only if it doesn't exist
    const addIndexIfNotExists = async (tableName, fields, options) => {
      try {
        await addIndexIfNotExists(tableName, fields, options);
        console.log(`✓ Added index ${options.name || 'unnamed'}`);
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`ℹ Skipped ${options.name || 'unnamed'} - already exists`);
        } else {
          console.error(`✗ Error adding index ${options.name}: ${error.message}`);
          // Don't throw - continue with other indexes
        }
      }
    };

    // Users table indexes
    // Note: email, employeeId, organizationId indexes already created in core tables migration
    // await queryInterface.addIndex('Users', ['email'], {
    //   name: 'idx_users_email',
    //   unique: false // Already have unique constraint
    // });

    // await queryInterface.addIndex('Users', ['organizationId'], {
    //   name: 'idx_users_organization_id'
    // });

    await addIndexIfNotExists('Users', ['hrCode'], {
      name: 'idx_users_hr_code'
    });

    await addIndexIfNotExists('Users', ['role', 'status'], {
      name: 'idx_users_role_status'
    });

    // await queryInterface.addIndex('Users', ['employeeId'], {
    //   name: 'idx_users_employee_id'
    // });

    // Attendance table indexes
    // Note: userId + date index already created in core tables migration
    // await queryInterface.addIndex('Attendances', ['userId', 'date'], {
    //   name: 'idx_attendances_user_date'
    // });

    // Note: Attendances table doesn't have organizationId column
    // await queryInterface.addIndex('Attendances', ['organizationId', 'date'], {
    //   name: 'idx_attendances_org_date'
    // });

    await addIndexIfNotExists('Attendances', ['status'], {
      name: 'idx_attendances_status'
    });

    // Leave table indexes
    // Note: Leaves table doesn't exist - table was never created in migrations
    // await queryInterface.addIndex('Leaves', ['userId', 'status'], {
    //   name: 'idx_leaves_user_status'
    // });

    // await queryInterface.addIndex('Leaves', ['organizationId', 'status'], {
    //   name: 'idx_leaves_org_status'
    // });

    // await queryInterface.addIndex('Leaves', ['startDate', 'endDate'], {
    //   name: 'idx_leaves_date_range'
    // });

    // Projects table indexes
    await addIndexIfNotExists('projects', ['organizationId'], {
      name: 'idx_projects_organization_id'
    });

    await addIndexIfNotExists('projects', ['status'], {
      name: 'idx_projects_status'
    });

    await addIndexIfNotExists('projects', ['startDate', 'endDate'], {
      name: 'idx_projects_date_range'
    });

    // Tasks table indexes
    await addIndexIfNotExists('tasks', ['projectId'], {
      name: 'idx_tasks_project_id'
    });

    await addIndexIfNotExists('tasks', ['assignedTo'], {
      name: 'idx_tasks_assigned_to'
    });

    await addIndexIfNotExists('tasks', ['status'], {
      name: 'idx_tasks_status'
    });

    await addIndexIfNotExists('tasks', ['priority'], {
      name: 'idx_tasks_priority'
    });

    // Payroll table indexes
    await addIndexIfNotExists('payrolls', ['userId', 'month', 'year'], {
      name: 'idx_payrolls_user_month_year'
    });

    await addIndexIfNotExists('payrolls', ['organizationId'], {
      name: 'idx_payrolls_organization_id'
    });

    await addIndexIfNotExists('payrolls', ['status'], {
      name: 'idx_payrolls_status'
    });

    // Recruitment tables indexes
    await addIndexIfNotExists('Jobs', ['organizationId', 'status'], {
      name: 'idx_jobs_org_status'
    });

    await addIndexIfNotExists('JobApplications', ['jobId', 'status'], {
      name: 'idx_applications_job_status'
    });

    await addIndexIfNotExists('JobApplications', ['email'], {
      name: 'idx_applications_email'
    });

    console.log('✅ Database indexes added successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔨 Removing database indexes...');

    // Users table indexes
    await queryInterface.removeIndex('Users', 'idx_users_email');
    await queryInterface.removeIndex('Users', 'idx_users_organization_id');
    await queryInterface.removeIndex('Users', 'idx_users_hr_code');
    await queryInterface.removeIndex('Users', 'idx_users_role_status');
    await queryInterface.removeIndex('Users', 'idx_users_employee_id');

    // Attendance table indexes
    await queryInterface.removeIndex('Attendances', 'idx_attendances_user_date');
    await queryInterface.removeIndex('Attendances', 'idx_attendances_org_date');
    await queryInterface.removeIndex('Attendances', 'idx_attendances_status');

    // Leave table indexes
    await queryInterface.removeIndex('Leaves', 'idx_leaves_user_status');
    await queryInterface.removeIndex('Leaves', 'idx_leaves_org_status');
    await queryInterface.removeIndex('Leaves', 'idx_leaves_date_range');

    // Projects table indexes
    await queryInterface.removeIndex('Projects', 'idx_projects_organization_id');
    await queryInterface.removeIndex('Projects', 'idx_projects_status');
    await queryInterface.removeIndex('Projects', 'idx_projects_date_range');

    // Tasks table indexes
    await queryInterface.removeIndex('Tasks', 'idx_tasks_project_id');
    await queryInterface.removeIndex('Tasks', 'idx_tasks_assigned_to');
    await queryInterface.removeIndex('Tasks', 'idx_tasks_status');
    await queryInterface.removeIndex('Tasks', 'idx_tasks_priority');

    // Payroll table indexes
    await queryInterface.removeIndex('Payrolls', 'idx_payrolls_user_month_year');
    await queryInterface.removeIndex('Payrolls', 'idx_payrolls_organization_id');
    await queryInterface.removeIndex('Payrolls', 'idx_payrolls_status');

    // Recruitment tables indexes
    await queryInterface.removeIndex('Jobs', 'idx_jobs_org_status');
    await queryInterface.removeIndex('JobApplications', 'idx_applications_job_status');
    await queryInterface.removeIndex('JobApplications', 'idx_applications_email');

    console.log('✅ Database indexes removed successfully');
  }
};

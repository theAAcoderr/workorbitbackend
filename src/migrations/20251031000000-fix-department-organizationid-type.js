'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Fix departments.organizationId type...');

    // Since no foreign key constraints exist, just change the column type
    console.log('  Changing column type from INTEGER to UUID...');
    await queryInterface.sequelize.query(`
      ALTER TABLE departments
      ALTER COLUMN "organizationId" TYPE UUID USING "organizationId"::text::uuid;
    `);

    // Add foreign key constraint
    console.log('  Adding foreign key constraint...');
    await queryInterface.addConstraint('departments', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'fk_departments_organizationId',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    console.log('✅ Successfully changed departments.organizationId to UUID type');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Reverting migration: Fix departments.organizationId type...');

    // Drop the foreign key constraint
    console.log('  Dropping foreign key constraint...');
    try {
      await queryInterface.removeConstraint('departments', 'fk_departments_organizationId');
    } catch (error) {
      console.log('  Foreign key constraint not found, continuing...');
    }

    // Change back to INTEGER (WARNING: This may cause data loss!)
    console.log('  Changing column type back to INTEGER...');
    await queryInterface.sequelize.query(`
      ALTER TABLE departments
      ALTER COLUMN "organizationId" TYPE INTEGER USING NULL;
    `);

    console.log('⚠️ Reverted departments.organizationId back to INTEGER type');
  }
};

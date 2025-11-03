'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Fix departments.managerId type...');

    // Change the managerId column type from INTEGER to UUID
    console.log('  Changing managerId column type from INTEGER to UUID...');
    await queryInterface.sequelize.query(`
      ALTER TABLE departments
      ALTER COLUMN "managerId" TYPE UUID USING "managerId"::text::uuid;
    `);

    // Add foreign key constraint
    console.log('  Adding foreign key constraint...');
    await queryInterface.addConstraint('departments', {
      fields: ['managerId'],
      type: 'foreign key',
      name: 'fk_departments_managerId',
      references: {
        table: 'Users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    console.log('✅ Successfully changed departments.managerId to UUID type');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Reverting migration: Fix departments.managerId type...');

    // Drop the foreign key constraint
    console.log('  Dropping foreign key constraint...');
    try {
      await queryInterface.removeConstraint('departments', 'fk_departments_managerId');
    } catch (error) {
      console.log('  Foreign key constraint not found, continuing...');
    }

    // Change back to INTEGER
    console.log('  Changing managerId column type back to INTEGER...');
    await queryInterface.sequelize.query(`
      ALTER TABLE departments
      ALTER COLUMN "managerId" TYPE INTEGER USING NULL;
    `);

    console.log('⚠️ Reverted departments.managerId back to INTEGER type');
  }
};

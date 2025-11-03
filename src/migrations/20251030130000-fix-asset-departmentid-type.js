'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint('Assets', 'Assets_departmentId_fkey');
    } catch (error) {
      console.log('Foreign key constraint does not exist or already removed');
    }

    // Clear any existing non-null departmentId values since we're changing types
    await queryInterface.sequelize.query(
      'UPDATE "Assets" SET "departmentId" = NULL WHERE "departmentId" IS NOT NULL;'
    );

    // Change departmentId from INTEGER to UUID (without foreign key)
    await queryInterface.changeColumn('Assets', 'departmentId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Clear values before reverting
    await queryInterface.sequelize.query(
      'UPDATE "Assets" SET "departmentId" = NULL WHERE "departmentId" IS NOT NULL;'
    );

    // Revert back to INTEGER
    await queryInterface.changeColumn('Assets', 'departmentId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};

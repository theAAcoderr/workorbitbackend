const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Fix the address column type - convert from VARCHAR to JSON
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users"
        ALTER COLUMN "address" TYPE JSON USING address::json;
      `);

      console.log('✅ Users address column fixed');
    } catch (error) {
      console.log('ℹ️  Address column might already be JSON or empty:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No need to revert - the old VARCHAR type was incorrect anyway
    console.log('ℹ️  Skipping down migration for address column');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change refreshToken column type from VARCHAR(255) to TEXT
    await queryInterface.changeColumn('Users', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Also update passwordResetToken to TEXT to prevent similar issues
    await queryInterface.changeColumn('Users', 'passwordResetToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Note: emailVerificationToken column doesn't exist in Users table
    // Skipping this column update
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to STRING (VARCHAR(255)) if needed
    await queryInterface.changeColumn('Users', 'refreshToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Users', 'passwordResetToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Note: emailVerificationToken column doesn't exist in Users table
    // Skipping this column update
  }
};
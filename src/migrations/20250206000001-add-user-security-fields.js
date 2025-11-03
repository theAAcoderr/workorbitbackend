'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add security fields to Users table
    await queryInterface.addColumn('Users', 'loginAttempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'lockUntil', {
      type: Sequelize.DATE,
      allowNull: true
    });

    console.log('✅ Added security fields (loginAttempts, lockUntil) to Users table');
  },

  async down(queryInterface, Sequelize) {
    // Remove security fields
    await queryInterface.removeColumn('Users', 'loginAttempts');
    await queryInterface.removeColumn('Users', 'lockUntil');

    console.log('✅ Removed security fields from Users table');
  }
};

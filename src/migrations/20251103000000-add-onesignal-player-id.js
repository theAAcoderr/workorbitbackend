'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add oneSignalPlayerId column to Users table
    await queryInterface.addColumn('Users', 'oneSignalPlayerId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'OneSignal Player ID for push notifications'
    });

    console.log('✅ Added oneSignalPlayerId column to Users table');
  },

  async down(queryInterface, Sequelize) {
    // Remove oneSignalPlayerId column
    await queryInterface.removeColumn('Users', 'oneSignalPlayerId');

    console.log('✅ Removed oneSignalPlayerId column from Users table');
  }
};

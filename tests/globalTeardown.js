/**
 * Jest Global Teardown
 * Runs once after all tests
 */

module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...\n');
  
  // Clean up test database if needed
  // await cleanupDatabase();
  
  console.log('✅ Cleanup complete!\n');
};


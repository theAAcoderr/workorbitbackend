/**
 * Update User Role Script
 * Quickly change a user's role to admin/hr/manager
 *
 * Usage: node src/scripts/update-user-role.js
 */

const { User } = require('../models');
const { sequelize } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function updateUserRole() {
  try {
    console.log('\n🔧 User Role Update Tool\n');
    console.log('This tool will update a user\'s role to allow course creation.\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Ask for email
    const email = await question('Enter user email: ');

    if (!email) {
      console.log('❌ Email is required');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      console.log(`\n❌ User not found with email: ${email}`);
      console.log('\nAvailable users:');
      const allUsers = await User.findAll({
        attributes: ['email', 'role'],
        limit: 10
      });
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      process.exit(1);
    }

    console.log(`\n📧 Found user: ${user.email}`);
    console.log(`📝 Current role: ${user.role}`);

    // Ask for new role
    console.log('\nAvailable roles:');
    console.log('  1. admin     - Full access (recommended)');
    console.log('  2. hr        - HR department access');
    console.log('  3. manager   - Manager access');
    console.log('  4. employee  - Regular employee (no course creation)');

    const roleChoice = await question('\nSelect role (1-4) or type role name: ');

    let newRole;
    switch (roleChoice.trim()) {
      case '1':
      case 'admin':
        newRole = 'admin';
        break;
      case '2':
      case 'hr':
        newRole = 'hr';
        break;
      case '3':
      case 'manager':
        newRole = 'manager';
        break;
      case '4':
      case 'employee':
        newRole = 'employee';
        break;
      default:
        console.log('❌ Invalid role selection');
        process.exit(1);
    }

    // Confirm
    const confirm = await question(`\n⚠️  Update ${email} from "${user.role}" to "${newRole}"? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Update cancelled');
      process.exit(0);
    }

    // Update user
    await user.update({ role: newRole });

    console.log(`\n✅ Successfully updated ${email} to ${newRole} role!`);

    if (['admin', 'hr', 'manager'].includes(newRole)) {
      console.log('\n🎉 This user can now create courses!');
    } else {
      console.log('\n⚠️  This user cannot create courses (employee role)');
    }

    console.log('\n📱 Next steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Log out and log in again in the app');
    console.log('  3. Try adding a course via the Add Course button');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
updateUserRole();

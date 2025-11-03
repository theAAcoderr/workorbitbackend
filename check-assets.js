const { Asset, User, Organization } = require('./src/models');

async function checkAssets() {
  try {
    console.log('Checking database for assets...\n');

    // Get all organizations
    const orgs = await Organization.findAll();
    console.log(`Organizations found: ${orgs.length}`);
    if (orgs.length > 0) {
      console.log('  First org:', orgs[0].name, '(', orgs[0].id, ')');
    }

    // Get all assets
    const assets = await Asset.findAll({
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    console.log(`\nTotal assets in database: ${assets.length}`);

    if (assets.length > 0) {
      console.log('\nAssets found:');
      assets.forEach((asset, index) => {
        console.log(`\n${index + 1}. ${asset.name} (${asset.assetCode})`);
        console.log(`   Category: ${asset.category}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Organization: ${asset.organizationId}`);
        console.log(`   Assigned to: ${asset.assignedTo ? asset.assignedTo.name : 'Unassigned'}`);
      });
    } else {
      console.log('\n⚠️  NO ASSETS FOUND IN DATABASE!');
      console.log('\nThis is why the tabs are empty.');
      console.log('You need to add some assets first.\n');
    }

    // Get admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (admin) {
      console.log(`\nAdmin user found: ${admin.name} (${admin.email})`);
      console.log(`Admin org: ${admin.organizationId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAssets();

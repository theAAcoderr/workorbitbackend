const { User, Asset } = require('./src/models');

async function debugUserOrg() {
  try {
    // Get the admin user (the one from the app logs)
    const userId = '8893ede3-e3dc-40dc-aeae-e4fc5f0e6f05';

    console.log('Checking user and their organization...\n');

    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Organization ID:', user.organizationId);
    console.log('   Status:', user.status);
    console.log('');

    // Count assets in this organization
    const assetCount = await Asset.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    console.log(`📦 Assets in user's organization: ${assetCount}`);
    console.log('');

    // Get all assets in this org
    const assets = await Asset.findAll({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      attributes: ['id', 'assetCode', 'name', 'status', 'organizationId']
    });

    if (assets.length > 0) {
      console.log('Assets in this organization:');
      assets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.assetCode} - ${asset.name} (${asset.status})`);
      });
    } else {
      console.log('⚠️  No assets found in this organization!');
      console.log('');

      // Check if assets exist in OTHER organizations
      const allAssets = await Asset.findAll({
        attributes: ['id', 'assetCode', 'name', 'organizationId']
      });

      console.log(`Total assets in database: ${allAssets.length}`);
      if (allAssets.length > 0) {
        console.log('');
        console.log('Assets exist but in DIFFERENT organizations:');
        const orgs = [...new Set(allAssets.map(a => a.organizationId))];
        orgs.forEach(orgId => {
          const count = allAssets.filter(a => a.organizationId === orgId).length;
          console.log(`  - Org ${orgId}: ${count} assets`);
        });
        console.log('');
        console.log('❌ MISMATCH! User org and asset org are different!');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUserOrg();

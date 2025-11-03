const { Asset, User } = require('./src/models');

async function fixAssetsOrg() {
  try {
    // The logged-in user from the app
    const currentUserId = '8893ede3-e3dc-40dc-aeae-e4fc5f0e6f05';

    const user = await User.findByPk(currentUserId);
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('Current user:', user.email);
    console.log('Current user org:', user.organizationId);
    console.log('');

    // Count existing assets in user's org
    const existingCount = await Asset.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    if (existingCount > 0) {
      console.log(`✅ User already has ${existingCount} assets. No need to add more.`);
      process.exit(0);
    }

    console.log('Creating 10 sample assets for this organization...\n');

    const assetsToCreate = [
      // Laptops
      {
        assetCode: 'LAP-00001',
        name: 'Dell Latitude 5520',
        description: 'Business laptop with Intel Core i5',
        category: 'laptop',
        type: 'hardware',
        brand: 'Dell',
        model: 'Latitude 5520',
        serialNumber: 'DL5520-2024-001',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 850.00,
        warrantyExpiryDate: new Date('2027-01-15'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: {
          processor: 'Intel Core i5-1135G7',
          ram: '16GB DDR4',
          storage: '512GB SSD',
          display: '15.6" FHD',
          os: 'Windows 11 Pro'
        }
      },
      {
        assetCode: 'LAP-00002',
        name: 'MacBook Pro 14"',
        description: 'MacBook Pro with M2 chip',
        category: 'laptop',
        type: 'hardware',
        brand: 'Apple',
        model: 'MacBook Pro 14" 2023',
        serialNumber: 'MBP-M2-2023-042',
        purchaseDate: new Date('2024-02-20'),
        purchasePrice: 1999.00,
        warrantyExpiryDate: new Date('2027-02-20'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: {
          processor: 'Apple M2 Pro',
          ram: '16GB Unified Memory',
          storage: '512GB SSD',
          display: '14.2" Liquid Retina XDR',
          os: 'macOS Sonoma'
        }
      },
      {
        assetCode: 'LAP-00003',
        name: 'HP EliteBook 850',
        description: 'HP business laptop',
        category: 'laptop',
        type: 'hardware',
        brand: 'HP',
        model: 'EliteBook 850 G9',
        serialNumber: 'HPE850-2024-128',
        purchaseDate: new Date('2024-03-10'),
        purchasePrice: 1200.00,
        warrantyExpiryDate: new Date('2027-03-10'),
        status: 'available',
        condition: 'good',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: {
          processor: 'Intel Core i7-1265U',
          ram: '32GB DDR5',
          storage: '1TB SSD'
        }
      },
      // Monitors
      {
        assetCode: 'MON-00001',
        name: 'Dell UltraSharp 27"',
        description: '27-inch 4K monitor',
        category: 'monitor',
        type: 'hardware',
        brand: 'Dell',
        model: 'U2723DE',
        serialNumber: 'DLMON-27-2024-056',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 550.00,
        warrantyExpiryDate: new Date('2027-01-20'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: {
          size: '27 inches',
          resolution: '2560x1440 (QHD)',
          refreshRate: '60Hz'
        }
      },
      {
        assetCode: 'MON-00002',
        name: 'LG UltraWide 34"',
        description: '34-inch ultrawide monitor',
        category: 'monitor',
        type: 'hardware',
        brand: 'LG',
        model: '34WN80C-B',
        serialNumber: 'LGUW34-2024-089',
        purchaseDate: new Date('2024-02-15'),
        purchasePrice: 450.00,
        warrantyExpiryDate: new Date('2027-02-15'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: {
          size: '34 inches',
          resolution: '3440x1440 (UWQHD)'
        }
      },
      // Accessories
      {
        assetCode: 'KEY-00001',
        name: 'Logitech MX Keys',
        description: 'Wireless keyboard',
        category: 'keyboard',
        type: 'hardware',
        brand: 'Logitech',
        model: 'MX Keys',
        serialNumber: 'LG-MXK-2024-234',
        purchaseDate: new Date('2024-01-25'),
        purchasePrice: 99.99,
        warrantyExpiryDate: new Date('2026-01-25'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: { type: 'Wireless' }
      },
      {
        assetCode: 'MOU-00001',
        name: 'Logitech MX Master 3',
        description: 'Advanced wireless mouse',
        category: 'mouse',
        type: 'hardware',
        brand: 'Logitech',
        model: 'MX Master 3',
        serialNumber: 'LG-MXM3-2024-567',
        purchaseDate: new Date('2024-01-25'),
        purchasePrice: 99.99,
        warrantyExpiryDate: new Date('2026-01-25'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: { type: 'Wireless', dpi: '4000 DPI' }
      },
      // Mobile Devices
      {
        assetCode: 'PHO-00001',
        name: 'iPhone 14 Pro',
        description: 'Company phone',
        category: 'phone',
        type: 'hardware',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'IPH14P-2024-891',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 999.00,
        warrantyExpiryDate: new Date('2025-02-01'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: { storage: '256GB' }
      },
      {
        assetCode: 'TAB-00001',
        name: 'iPad Pro 12.9"',
        description: 'iPad for presentations',
        category: 'tablet',
        type: 'hardware',
        brand: 'Apple',
        model: 'iPad Pro 12.9" (2023)',
        serialNumber: 'IPADP-2024-445',
        purchaseDate: new Date('2024-03-01'),
        purchasePrice: 1099.00,
        warrantyExpiryDate: new Date('2026-03-01'),
        status: 'available',
        condition: 'excellent',
        location: 'Main Office - IT Storage',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: { storage: '256GB' }
      },
      {
        assetCode: 'PRI-00001',
        name: 'HP LaserJet Pro M404dn',
        description: 'Office laser printer',
        category: 'printer',
        type: 'hardware',
        brand: 'HP',
        model: 'LaserJet Pro M404dn',
        serialNumber: 'HPLJ-M404-2024-773',
        purchaseDate: new Date('2024-01-10'),
        purchasePrice: 349.99,
        warrantyExpiryDate: new Date('2025-01-10'),
        status: 'available',
        condition: 'good',
        location: 'Main Office - Print Room',
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
        specifications: { type: 'Laser', printSpeed: '40 ppm' }
      }
    ];

    // Create assets
    for (const assetData of assetsToCreate) {
      const asset = await Asset.create(assetData);
      console.log(`✅ Created: ${asset.name} (${asset.assetCode})`);
    }

    console.log(`\n🎉 Successfully created ${assetsToCreate.length} assets!`);
    console.log(`Organization: ${user.organizationId}`);
    console.log(`User: ${user.email}`);
    console.log('\nNow refresh your app and check the All Assets tab!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAssetsOrg();

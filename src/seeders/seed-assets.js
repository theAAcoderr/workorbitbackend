const { Asset, User, Organization } = require('../models');

async function seedAssets() {
  try {
    console.log('🌱 Starting asset seeding...\n');

    // Get admin user and organization
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin first.');
      process.exit(1);
    }

    const org = await Organization.findByPk(admin.organizationId);
    if (!org) {
      console.error('❌ No organization found.');
      process.exit(1);
    }

    console.log(`✅ Found organization: ${org.name}`);
    console.log(`✅ Found admin: ${admin.name}\n`);

    // Check if assets already exist
    const existingAssets = await Asset.count({ where: { organizationId: org.id } });
    if (existingAssets > 0) {
      console.log(`⚠️  ${existingAssets} assets already exist. Skipping...`);
      process.exit(0);
    }

    // Sample assets to create
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
        organizationId: org.id,
        createdById: admin.id,
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
        organizationId: org.id,
        createdById: admin.id,
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
        description: 'HP business laptop with security features',
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          processor: 'Intel Core i7-1265U',
          ram: '32GB DDR5',
          storage: '1TB SSD',
          display: '15.6" FHD',
          os: 'Windows 11 Pro'
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          size: '27 inches',
          resolution: '2560x1440 (QHD)',
          refreshRate: '60Hz',
          panel: 'IPS',
          ports: 'HDMI, DisplayPort, USB-C'
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          size: '34 inches',
          resolution: '3440x1440 (UWQHD)',
          refreshRate: '60Hz',
          panel: 'IPS',
          curvature: '1900R'
        }
      },

      // Keyboards
      {
        assetCode: 'KEY-00001',
        name: 'Logitech MX Keys',
        description: 'Wireless keyboard for business',
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          type: 'Wireless',
          connectivity: 'Bluetooth, USB Receiver',
          layout: 'Full-size',
          backlight: 'Yes'
        }
      },

      // Mouse
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          type: 'Wireless',
          connectivity: 'Bluetooth, USB Receiver',
          dpi: '4000 DPI',
          buttons: '7 programmable buttons'
        }
      },

      // Phone
      {
        assetCode: 'PHO-00001',
        name: 'iPhone 14 Pro',
        description: 'Company phone for sales team',
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          storage: '256GB',
          color: 'Space Black',
          network: '5G',
          display: '6.1" Super Retina XDR'
        }
      },

      // Tablet
      {
        assetCode: 'TAB-00001',
        name: 'iPad Pro 12.9"',
        description: 'iPad for presentations and design work',
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          storage: '256GB',
          connectivity: 'Wi-Fi + Cellular',
          processor: 'Apple M2',
          display: '12.9" Liquid Retina XDR'
        }
      },

      // Printer
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
        organizationId: org.id,
        createdById: admin.id,
        isActive: true,
        specifications: {
          type: 'Laser',
          printSpeed: '40 ppm',
          connectivity: 'Ethernet, USB',
          duplex: 'Automatic',
          paperCapacity: '350 sheets'
        }
      }
    ];

    // Create assets
    console.log(`Creating ${assetsToCreate.length} sample assets...\n`);

    for (const assetData of assetsToCreate) {
      const asset = await Asset.create(assetData);
      console.log(`✅ Created: ${asset.name} (${asset.assetCode})`);
    }

    console.log(`\n🎉 Successfully seeded ${assetsToCreate.length} assets!`);
    console.log('\nAsset Summary:');
    console.log('  - 3 Laptops');
    console.log('  - 2 Monitors');
    console.log('  - 1 Keyboard');
    console.log('  - 1 Mouse');
    console.log('  - 1 Phone');
    console.log('  - 1 Tablet');
    console.log('  - 1 Printer');
    console.log('\nAll assets are set to "available" status.');
    console.log('You can now assign them to employees or view them in the app!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding assets:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAssets();
}

module.exports = seedAssets;

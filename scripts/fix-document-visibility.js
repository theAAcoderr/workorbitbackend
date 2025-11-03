/**
 * Script to fix document visibility
 * Sets all documents without proper visibility to 'private'
 */

const { Document } = require('../src/models');
const { Op } = require('sequelize');

async function fixDocumentVisibility() {
  try {
    console.log('🔧 Starting document visibility fix...');

    // Find documents with null visibility
    const documentsToFix = await Document.findAll({
      where: {
        visibility: null
      }
    });

    console.log(`📋 Found ${documentsToFix.length} documents to fix`);

    // Update each document to private
    for (const doc of documentsToFix) {
      await doc.update({ visibility: 'private' });
      console.log(`✅ Fixed document ${doc.id}: ${doc.name} -> visibility: private`);
    }

    // Also ensure all private documents don't have organization-wide access
    const privateDocsWithWrongVisibility = await Document.findAll({
      where: {
        uploadedById: { [Op.ne]: null },
        [Op.or]: [
          { visibility: 'organization' },
          { visibility: 'public' }
        ]
      }
    });

    console.log(`\n📋 Found ${privateDocsWithWrongVisibility.length} documents with overly permissive visibility`);

    if (privateDocsWithWrongVisibility.length > 0) {
      console.log('\n⚠️  WARNING: Some documents are set to "organization" or "public" visibility.');
      console.log('These documents will be visible to all users in the organization.');
      console.log('If this is intentional, no action needed.');
      console.log('To make them private, run: UPDATE "Documents" SET visibility = \'private\' WHERE visibility IN (\'organization\', \'public\');');
    }

    console.log('\n✅ Document visibility fix completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Fixed ${documentsToFix.length} documents with invalid visibility`);
    console.log(`   - Found ${privateDocsWithWrongVisibility.length} documents with permissive visibility`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing document visibility:', error);
    process.exit(1);
  }
}

// Run the script
fixDocumentVisibility();

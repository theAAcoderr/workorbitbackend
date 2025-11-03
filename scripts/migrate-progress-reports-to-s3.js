const fs = require('fs');
const path = require('path');
const s3Service = require('../services/s3.service');
const ProgressReport = require('../src/models/ProgressReport');

async function migrateProgressReportsToS3() {
  try {
    console.log('🚀 Starting migration of progress report files to S3...');

    const uploadsDir = path.join(__dirname, '../uploads/progress-reports');

    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('ℹ️  No local uploads directory found. Nothing to migrate.');
      return;
    }

    // Get all files in the directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files to potentially migrate`);

    if (files.length === 0) {
      console.log('ℹ️  No files to migrate');
      return;
    }

    let migratedCount = 0;
    const migrationResults = [];

    // Process each file
    for (const fileName of files) {
      const filePath = path.join(uploadsDir, fileName);
      const fileStats = fs.statSync(filePath);

      if (fileStats.isDirectory()) {
        console.log(`⏭️  Skipping directory: ${fileName}`);
        continue;
      }

      try {
        console.log(`\n🔄 Processing: ${fileName}`);

        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const fileExtension = path.extname(fileName);
        const fileSizeInMB = (fileStats.size / (1024 * 1024)).toFixed(2);

        console.log(`   📏 Size: ${fileSizeInMB} MB`);

        // Determine MIME type
        let mimeType = 'application/octet-stream';
        if (fileExtension.toLowerCase() === '.jpg' || fileExtension.toLowerCase() === '.jpeg') {
          mimeType = 'image/jpeg';
        } else if (fileExtension.toLowerCase() === '.png') {
          mimeType = 'image/png';
        } else if (fileExtension.toLowerCase() === '.gif') {
          mimeType = 'image/gif';
        } else if (fileExtension.toLowerCase() === '.pdf') {
          mimeType = 'application/pdf';
        }

        // Create file object for S3 service
        const fileObject = {
          buffer: fileBuffer,
          originalname: fileName,
          mimetype: mimeType,
          size: fileStats.size
        };

        // Upload to S3
        console.log(`   ⏳ Uploading to S3...`);
        const uploadResult = await s3Service.uploadFile(fileObject, 'progress-reports');

        if (uploadResult.success) {
          console.log(`   ✅ Upload successful: ${uploadResult.data.url}`);

          migrationResults.push({
            originalFile: fileName,
            s3Url: uploadResult.data.url,
            s3Key: uploadResult.data.key,
            success: true
          });

          migratedCount++;

          // Optionally, you can update database records here
          // This would require finding progress reports that reference the old file paths
          // and updating them to use the new S3 URLs

        } else {
          console.log(`   ❌ Upload failed: ${uploadResult.error}`);
          migrationResults.push({
            originalFile: fileName,
            error: uploadResult.error,
            success: false
          });
        }

      } catch (error) {
        console.error(`   💥 Error processing ${fileName}: ${error.message}`);
        migrationResults.push({
          originalFile: fileName,
          error: error.message,
          success: false
        });
      }
    }

    // Summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} files`);
    console.log(`   ❌ Failed: ${files.length - migratedCount} files`);

    // Show results
    console.log(`\n📋 Detailed Results:`);
    migrationResults.forEach(result => {
      if (result.success) {
        console.log(`   ✅ ${result.originalFile} → ${result.s3Url}`);
      } else {
        console.log(`   ❌ ${result.originalFile} → ${result.error}`);
      }
    });

    if (migratedCount > 0) {
      console.log(`\n⚠️  Important Notes:`);
      console.log(`   1. ${migratedCount} files have been uploaded to S3`);
      console.log(`   2. Original files are still in the local uploads folder`);
      console.log(`   3. You may want to update database records to use new S3 URLs`);
      console.log(`   4. Consider backing up and removing old local files after verification`);
    }

    console.log(`\n🎉 Migration process completed!`);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
  }
}

// Run the migration
if (require.main === module) {
  migrateProgressReportsToS3();
}

module.exports = { migrateProgressReportsToS3 };
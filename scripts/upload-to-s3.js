const fs = require('fs');
const path = require('path');
const s3Service = require('../services/s3.service');

async function uploadLocalFileToS3(localFilePath, s3Folder = 'progress-reports') {
  try {
    console.log(`🚀 Starting upload of: ${localFilePath}`);

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    // Read file
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileName = path.basename(localFilePath);
    const fileExtension = path.extname(localFilePath);

    // Get file stats
    const stats = fs.statSync(localFilePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`📄 File: ${fileName}`);
    console.log(`📏 Size: ${fileSizeInMB} MB`);
    console.log(`📁 Target S3 folder: ${s3Folder}`);

    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (fileExtension.toLowerCase() === '.jpg' || fileExtension.toLowerCase() === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (fileExtension.toLowerCase() === '.png') {
      mimeType = 'image/png';
    } else if (fileExtension.toLowerCase() === '.gif') {
      mimeType = 'image/gif';
    }

    // Create a file-like object that matches the S3 service expectation
    const fileObject = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: mimeType,
      size: stats.size
    };

    // Upload to S3
    console.log('⏳ Uploading to S3...');
    const result = await s3Service.uploadFile(fileObject, s3Folder);

    if (result.success) {
      console.log('✅ Upload successful!');
      console.log(`🔗 S3 URL: ${result.data.url}`);
      console.log(`🔑 S3 Key: ${result.data.key}`);
      console.log(`🪣 Bucket: ${result.data.bucket}`);
      return result;
    } else {
      console.error('❌ Upload failed:', result.error);
      return result;
    }

  } catch (error) {
    console.error('💥 Error during upload:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main execution
async function main() {
  const uploadsDir = 'C:\\Users\\Administrator\\Desktop\\workorbitbackend\\nodeworkorbit\\uploads\\progress-reports';

  try {
    // Get all files in the directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in ${uploadsDir}`);

    if (files.length === 0) {
      console.log('ℹ️  No files to upload');
      return;
    }

    // Upload each file
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);

      // Skip directories
      if (fs.statSync(filePath).isDirectory()) {
        continue;
      }

      console.log(`\n🔄 Processing: ${file}`);
      const result = await uploadLocalFileToS3(filePath, 'progress-reports');

      if (result.success) {
        console.log(`✅ Successfully uploaded: ${file}`);
      } else {
        console.log(`❌ Failed to upload: ${file} - ${result.error}`);
      }
    }

    console.log('\n🎉 Upload process completed!');

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { uploadLocalFileToS3 };
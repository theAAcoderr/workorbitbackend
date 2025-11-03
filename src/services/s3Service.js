const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
require('dotenv').config();

/**
 * AWS S3 Service for Document Management
 * Handles file uploads, downloads, and deletions from S3 bucket
 */

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'work-orbit-latest';

/**
 * Configure Multer S3 Storage
 */
const storage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.id || 'unknown',
      uploadDate: new Date().toISOString()
    });
  },
  key: function (req, file, cb) {
    // Generate unique filename: documents/organizationId/timestamp-randomstring-originalname
    const organizationId = req.user?.organizationId || 'default';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const fileName = `documents/${organizationId}/${nameWithoutExt}-${uniqueSuffix}${ext}`;
    cb(null, fileName);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE
});

/**
 * File filter for allowed file types
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

/**
 * Multer upload configuration with S3
 */
const uploadS3 = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Get signed URL for downloading a file from S3
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
async function getSignedDownloadUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
async function deleteFileFromS3(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    console.log(`✅ File deleted from S3: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

/**
 * Upload file directly to S3 (without multer)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {object} metadata - Additional metadata
 * @returns {Promise<string>} S3 object key
 */
async function uploadFileToS3(fileBuffer, fileName, mimeType, metadata = {}) {
  try {
    const organizationId = metadata.organizationId || 'default';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    const key = `documents/${organizationId}/${nameWithoutExt}-${uniqueSuffix}${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        originalName: fileName,
        uploadDate: new Date().toISOString(),
        ...metadata
      }
    });

    await s3Client.send(command);
    console.log(`✅ File uploaded to S3: ${key}`);
    return key;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Get public URL for S3 object (without signing)
 * Note: This only works if the bucket/object has public read access
 * @param {string} key - S3 object key
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;
}

module.exports = {
  uploadS3,
  s3Client,
  getSignedDownloadUrl,
  deleteFileFromS3,
  uploadFileToS3,
  getPublicUrl,
  BUCKET_NAME
};

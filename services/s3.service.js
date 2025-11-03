const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_BUCKET_NAME } = require('../config/s3.config');
const crypto = require('crypto');
const path = require('path');

class S3Service {
  generateFileName(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}-${randomString}${extension}`;
  }

  async uploadFile(file, folder = 'uploads') {
    try {
      const fileName = this.generateFileName(file.originalname);
      const key = `${folder}/${fileName}`;

      const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const fileUrl = `https://${S3_BUCKET_NAME}.s3.us-west-2.amazonaws.com/${key}`;

      // Log the URL to verify it's not being encoded here
      console.log('S3 Service - Generated URL:', fileUrl);

      return {
        success: true,
        data: {
          key,
          url: fileUrl,
          bucket: S3_BUCKET_NAME,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        }
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(key) {
    try {
      const deleteParams = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting from S3:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSignedUploadUrl(fileName, folder = 'uploads', expiresIn = 3600) {
    try {
      const key = `${folder}/${this.generateFileName(fileName)}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });

      return {
        success: true,
        data: {
          uploadUrl: url,
          key,
          expiresIn
        }
      };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });

      return {
        success: true,
        data: {
          downloadUrl: url,
          expiresIn
        }
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkFileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new S3Service();
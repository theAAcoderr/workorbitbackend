const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'work-orbit-latest';

module.exports = {
  s3Client,
  S3_BUCKET_NAME,
};
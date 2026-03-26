const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { AWS_S3_BUCKET } = require('../config/env');
const logger = require('../config/logger');

const deleteFile = async (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
      })
    );
    logger.info('S3 file deleted', { key });
  } catch (err) {
    logger.error('S3 delete failed', { fileUrl, error: err.message });
  }
};

module.exports = { deleteFile };
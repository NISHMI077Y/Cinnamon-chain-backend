require('dotenv').config();

const required = [
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'AWS_S3_BUCKET',
  'SEPOLIA_RPC_URL',
  'BLOCKCHAIN_PRIVATE_KEY',
];

const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');

if (missing.length > 0) {
  console.error('\n========================================');
  console.error('FATAL: Missing required environment variables:');
  missing.forEach((key) => console.error(`  ❌ ${key}`));
  console.error('========================================\n');
  process.exit(1);
}

console.log('✅ All environment variables loaded');

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  ADMIN_TOTP_ISSUER: process.env.ADMIN_TOTP_ISSUER || 'CinnamonChain',

  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,

  LAB_ADDRESS: process.env.LAB_ADDRESS || 'CinnamonChain Lab, Galle, Sri Lanka',
};
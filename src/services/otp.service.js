const redis = require('../config/redis');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { NODE_ENV, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = require('../config/env');

let twilioClient;
if (NODE_ENV === 'production' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

const OTP_TTL = 300; // 5 minutes

const sendOTP = async (phoneNumber) => {
  const maskedPhone = `***${phoneNumber.slice(-4)}`;

  if (NODE_ENV === 'production' && twilioClient) {
    try {
      await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: 'sms' });
      logger.info(`OTP sent via Twilio to ${maskedPhone}`);
    } catch (err) {
      logger.error(`Twilio OTP send failed for ${maskedPhone}`, { error: err.message });
      throw new AppError('Could not send OTP. Try again.', 503, 'OTP_SEND_FAILED');
    }
  } else {
    // Development: Redis-based OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await redis.setex(`otp:${phoneNumber}`, OTP_TTL, otp);
    logger.info(`[DEV] OTP for ${maskedPhone}: ${otp}`);
    console.log(`\n📱 OTP for ${phoneNumber}: ${otp}\n`);
  }
};

const verifyOTP = async (phoneNumber, otp) => {
  if (NODE_ENV === 'production' && twilioClient) {
    try {
      const check = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code: otp });

      if (check.status !== 'approved') {
        throw new AppError('Invalid OTP', 401, 'INVALID_OTP');
      }
    } catch (err) {
      if (err.isOperational) throw err;
      throw new AppError('Invalid OTP', 401, 'INVALID_OTP');
    }
  } else {
    const storedOtp = await redis.get(`otp:${phoneNumber}`);
    if (!storedOtp) {
      throw new AppError('OTP expired. Request a new one.', 401, 'OTP_EXPIRED');
    }
    if (storedOtp !== otp) {
      throw new AppError('Invalid OTP', 401, 'INVALID_OTP');
    }
    await redis.del(`otp:${phoneNumber}`);
  }
};

module.exports = { sendOTP, verifyOTP };
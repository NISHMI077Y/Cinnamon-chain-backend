const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const googleService = require('./google.service');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const adminActionService = require('./adminAction.service');
const { sha256 } = require('../utils/hashUtils');

const googleLogin = async ({ id_token, intended_role }) => {
  const googleData = await googleService.verifyIdToken(id_token);
  let user = await User.findOne({ google_id: googleData.google_id });

  if (user) {
    if (user.status === 'SUSPENDED') {
      throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
    }
    if (user.role !== intended_role) {
      throw new AppError(
        'Account already registered under a different role',
        409,
        'ROLE_CONFLICT'
      );
    }
    user.last_login_at = new Date();
    await user.save();
  } else {
    if (!['PEELER', 'PLANTATION_OWNER'].includes(intended_role)) {
      throw new AppError(
        'Self-registration not permitted for this role',
        403,
        'SELF_REGISTER_FORBIDDEN'
      );
    }
    user = await User.create({
      google_id: googleData.google_id,
      email: googleData.email,
      display_name: googleData.name,
      avatar_url: googleData.picture,
      role: intended_role,
      auth_method: 'GOOGLE',
      status: 'ACTIVE',
      last_login_at: new Date(),
    });
  }

  const tokens = await tokenService.issueTokenPair(user);

  return {
    ...tokens,
    user: {
      user_id: user._id,
      role: user.role,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    },
  };
};

const phoneLogin = async ({ phone_number }) => {
  const user = await User.findOne({ phone_number });
  if (!user) {
    throw new AppError('No account found for this number', 404, 'USER_NOT_FOUND');
  }
  if (user.status === 'SUSPENDED') {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }
  if (!['BUYER', 'LAB_TECHNICIAN'].includes(user.role)) {
    throw new AppError('Use Google login for this account', 403, 'WRONG_AUTH_METHOD');
  }

  await otpService.sendOTP(phone_number);

  return { message: 'OTP sent', expires_in: 300 };
};

const phoneVerify = async ({ phone_number, otp }) => {
  const user = await User.findOne({ phone_number });
  if (!user) {
    throw new AppError('No account found for this number', 404, 'USER_NOT_FOUND');
  }
  if (user.status === 'SUSPENDED') {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }
  if (!['BUYER', 'LAB_TECHNICIAN'].includes(user.role)) {
    throw new AppError('Use Google login for this account', 403, 'WRONG_AUTH_METHOD');
  }

  await otpService.verifyOTP(phone_number, otp);

  user.last_login_at = new Date();
  await user.save();

  const tokens = await tokenService.issueTokenPair(user);

  return {
    ...tokens,
    user: {
      user_id: user._id,
      role: user.role,
    },
  };
};

const adminLogin = async ({ username, password }) => {
  const user = await User.findOne({ username, role: 'SYSTEM_ADMIN' }).select('+password_hash');
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const temp_token = tokenService.issueTempToken({
    user_id: user._id.toString(),
    step: 'TOTP_PENDING',
  });

  return { temp_token, requires_totp: true };
};

const adminVerifyTotp = async ({ user_id, totp_code, ip }) => {
  const user = await User.findById(user_id).select('+totp_secret');
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: totp_code,
    window: 1,
  });

  if (!isValid) {
    throw new AppError('Invalid authenticator code', 401, 'INVALID_TOTP');
  }

  user.last_login_at = new Date();
  await user.save();

  const tokens = await tokenService.issueTokenPair(user);

  await adminActionService.log({
    admin_id: user._id,
    action_type: 'ADMIN_LOGIN',
    ip,
  });

  return tokens;
};

module.exports = { googleLogin, phoneLogin, phoneVerify, adminLogin, adminVerifyTotp };
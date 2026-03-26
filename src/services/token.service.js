const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const RefreshToken = require('../models/RefreshToken');
const AppError = require('../utils/AppError');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
} = require('../config/env');

const issueAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
};

const issueTempToken = (payload, expiresIn = '2m') => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

const issueTokenPair = async (user) => {
  const accessPayload = { user_id: user._id.toString(), role: user.role };
  const access_token = issueAccessToken(accessPayload);

  const jti = uuidv4();
  const token_family = uuidv4();
  const refreshPayload = { user_id: user._id.toString(), jti };
  const refresh_token = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });

  const decoded = jwt.decode(refresh_token);

  await RefreshToken.create({
    jti,
    user_id: user._id,
    token_family,
    expires_at: new Date(decoded.exp * 1000),
  });

  return { access_token, refresh_token };
};

const refreshTokens = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 401, 'INVALID_REFRESH_TOKEN');
    }
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const storedToken = await RefreshToken.findOne({ jti: decoded.jti });
  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (storedToken.is_revoked) {
    await RefreshToken.updateMany(
      { token_family: storedToken.token_family },
      { is_revoked: true }
    );
    throw new AppError('Token reuse detected. Please log in again.', 401, 'TOKEN_REUSE_DETECTED');
  }

  storedToken.is_revoked = true;
  await storedToken.save();

  const User = require('../models/User');
  const user = await User.findById(decoded.user_id);
  if (!user) {
    throw new AppError('User not found', 401, 'INVALID_REFRESH_TOKEN');
  }

  const accessPayload = { user_id: user._id.toString(), role: user.role };
  const access_token = issueAccessToken(accessPayload);

  const newJti = uuidv4();
  const refreshPayload = { user_id: user._id.toString(), jti: newJti };
  const refresh_token = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
  const newDecoded = jwt.decode(refresh_token);

  await RefreshToken.create({
    jti: newJti,
    user_id: user._id,
    token_family: storedToken.token_family,
    expires_at: new Date(newDecoded.exp * 1000),
  });

  return { access_token, refresh_token };
};

const revokeToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    await RefreshToken.findOneAndUpdate({ jti: decoded.jti }, { is_revoked: true });
  } catch (_err) {
    // Token may be invalid/expired — safe to ignore
  }
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany({ user_id: userId, is_revoked: false }, { is_revoked: true });
};

module.exports = {
  issueAccessToken,
  issueTempToken,
  verifyAccessToken,
  issueTokenPair,
  refreshTokens,
  revokeToken,
  revokeAllUserTokens,
};
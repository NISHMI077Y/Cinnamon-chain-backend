const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

exports.googleLogin = catchAsync(async (req, res) => {
  const result = await authService.googleLogin(req.body);
  res.status(200).json({ status: 'success', data: result });
});

exports.phoneLogin = catchAsync(async (req, res) => {
  const result = await authService.phoneLogin(req.body);
  res.status(200).json({ status: 'success', data: result });
});

exports.phoneVerify = catchAsync(async (req, res) => {
  const result = await authService.phoneVerify(req.body);
  res.status(200).json({ status: 'success', data: result });
});

exports.adminLogin = catchAsync(async (req, res) => {
  const result = await authService.adminLogin(req.body);
  res.status(200).json({ status: 'success', data: result });
});

exports.adminVerifyTotp = catchAsync(async (req, res) => {
  // Verify temp token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'NO_TOKEN');
  }
  const tempToken = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = tokenService.verifyAccessToken(tempToken);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please log in again.', 401, 'TOTP_SESSION_EXPIRED');
    }
    throw new AppError('Session expired. Please log in again.', 401, 'TOTP_SESSION_EXPIRED');
  }

  if (decoded.step !== 'TOTP_PENDING') {
    throw new AppError('Invalid token type', 403, 'INVALID_TOKEN_TYPE');
  }

  const result = await authService.adminVerifyTotp({
    user_id: decoded.user_id,
    totp_code: req.body.totp_code,
    ip: req.ip,
  });

  res.status(200).json({ status: 'success', data: result });
});

exports.refresh = catchAsync(async (req, res) => {
  const result = await tokenService.refreshTokens(req.body.refresh_token);
  res.status(200).json({ status: 'success', data: result });
});

exports.logout = catchAsync(async (req, res) => {
  await tokenService.revokeToken(req.body.refresh_token);
  res.status(200).json({ status: 'success', data: { message: 'Logged out successfully' } });
});
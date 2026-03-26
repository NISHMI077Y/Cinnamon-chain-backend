const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { JWT_ACCESS_SECRET } = require('../config/env');

const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'NO_TOKEN'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
  }
};

module.exports = authenticate;
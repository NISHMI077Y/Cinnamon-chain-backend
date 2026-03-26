const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, code, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        status: 'fail',
        code: code || 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests. Please try again later.',
      });
    },
  });

const authLimiter = createLimiter(15 * 60 * 1000, 10, 'RATE_LIMIT_EXCEEDED');
const adminAuthLimiter = createLimiter(15 * 60 * 1000, 5, 'RATE_LIMIT_EXCEEDED');
const uploadLimiter = createLimiter(60 * 60 * 1000, 20, 'RATE_LIMIT_EXCEEDED');
const generalLimiter = createLimiter(15 * 60 * 1000, 100, 'RATE_LIMIT_EXCEEDED');

module.exports = { authLimiter, adminAuthLimiter, uploadLimiter, generalLimiter };
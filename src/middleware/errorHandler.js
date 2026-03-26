const logger = require('../config/logger');
const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 1. Operational errors (AppError)
  if (err.isOperational) {
    const response = {
      status: err.status,
      code: err.code,
      message: err.message,
    };
    if (err.errors) response.errors = err.errors;
    return res.status(err.statusCode).json(response);
  }

  // 2. Mongoose ValidationError
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    return res.status(400).json({
      status: 'fail',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    });
  }

  // 3. Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      code: 'INVALID_ID',
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // 4. MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      status: 'fail',
      code: 'DUPLICATE_KEY',
      message: `${field} already exists`,
    });
  }

  // 5. JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      code: 'INVALID_TOKEN',
      message: 'Invalid token. Please log in again.',
    });
  }

  // 6. JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      code: 'TOKEN_EXPIRED',
      message: 'Your token has expired. Please log in again.',
    });
  }

  // 7. Joi ValidationError
  if (err.isJoi || err.name === 'ValidationError') {
    const errors = (err.details || []).map((d) => ({
      field: d.context?.key || d.path?.join('.'),
      message: d.message,
    }));
    return res.status(422).json({
      status: 'fail',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    });
  }

  // 8. Multer errors
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name for file upload',
    };
    return res.status(400).json({
      status: 'fail',
      code: 'UPLOAD_ERROR',
      message: messages[err.code] || err.message,
    });
  }

  // 9. Unknown / programming errors
  logger.error('UNHANDLED ERROR', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }

  // Development: expose full error
  return res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

module.exports = errorHandler;
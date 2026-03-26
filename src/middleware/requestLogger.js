const morgan = require('morgan');
const logger = require('../config/logger');

const requestLogger = morgan('combined', {
  stream: logger.stream,
  skip: (_req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'production',
});

module.exports = requestLogger;
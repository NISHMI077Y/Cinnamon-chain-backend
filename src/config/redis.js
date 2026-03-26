const Redis = require('ioredis');
const logger = require('./logger');
const { REDIS_URL } = require('./env');

let redis;

try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis connection failed — running without Redis');
        return null; // stop retrying
      }
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => {
    if (err.message.includes('NOAUTH')) {
      logger.warn('Redis requires password — check REDIS_URL in .env');
    } else {
      logger.error(`Redis error: ${err.message}`);
    }
  });

  // Try connecting
  redis.connect().catch((err) => {
    logger.warn(`Redis connect failed: ${err.message}`);
  });
} catch (err) {
  logger.warn(`Redis init failed: ${err.message}`);
  // Create a mock redis for development
  redis = {
    get: async () => null,
    setex: async () => 'OK',
    set: async () => 'OK',
    del: async () => 1,
    on: () => {},
  };
}

module.exports = redis;
const axios = require('axios');
const AppError = require('../utils/AppError');
const { GOOGLE_CLIENT_ID } = require('../config/env');
const logger = require('../config/logger');

const verifyIdToken = async (idToken) => {
  try {
    const { data } = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (data.aud !== GOOGLE_CLIENT_ID) {
      throw new AppError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN');
    }

    return {
      google_id: data.sub,
      email: data.email,
      name: data.name || data.email?.split('@')[0],
      picture: data.picture,
    };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Google token verification failed', { error: err.message });
    throw new AppError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN');
  }
};

module.exports = { verifyIdToken };
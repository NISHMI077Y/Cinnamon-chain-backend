const logger = require('../config/logger');

const setupBidSocket = (_io, socket) => {
  // Bid-related events are server-initiated (emitted from controllers via notification.service).
  // Client can subscribe to acknowledgement events here.

  socket.on('SUBSCRIBE_LISTING', (listingId) => {
    socket.join(`listing:${listingId}`);
    logger.info(`User ${socket.user.user_id} subscribed to listing:${listingId}`);
  });

  socket.on('UNSUBSCRIBE_LISTING', (listingId) => {
    socket.leave(`listing:${listingId}`);
  });
};

module.exports = setupBidSocket;
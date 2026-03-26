const Transaction = require('../models/Transaction');
const logger = require('../config/logger');

const locationTimers = new Map();

const setupChatSocket = (io, socket) => {
  const userId = socket.user.user_id;

  // Join a transaction chat room
  socket.on('JOIN_CHAT', async (transactionId) => {
    try {
      const tx = await Transaction.findById(transactionId).lean();
      if (!tx) {
        return socket.emit('ERROR', { code: 'INVALID_TRANSACTION' });
      }
      const peelerId = tx.peeler_id.toString();
      const buyerId = tx.buyer_id.toString();
      if (userId !== peelerId && userId !== buyerId) {
        return socket.emit('ERROR', { code: 'UNAUTHORIZED_CHAT' });
      }
      socket.join(`transaction:${transactionId}`);
      logger.info(`User ${userId} joined chat room transaction:${transactionId}`);
    } catch (err) {
      logger.error('JOIN_CHAT error', { error: err.message });
      socket.emit('ERROR', { code: 'INTERNAL_ERROR' });
    }
  });

  // Send private message
  socket.on('SEND_MESSAGE', async ({ transactionId, message }) => {
    try {
      const tx = await Transaction.findById(transactionId).lean();
      if (!tx) return socket.emit('ERROR', { code: 'INVALID_TRANSACTION' });

      const peelerId = tx.peeler_id.toString();
      const buyerId = tx.buyer_id.toString();

      if (userId !== peelerId && userId !== buyerId) {
        return socket.emit('ERROR', { code: 'UNAUTHORIZED_CHAT' });
      }

      io.to(`transaction:${transactionId}`).emit('NEW_MESSAGE', {
        transactionId,
        sender_id: userId,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('SEND_MESSAGE error', { error: err.message });
    }
  });

  // Share location
  socket.on('SHARE_LOCATION', async ({ transactionId, lat, lng }) => {
    try {
      const tx = await Transaction.findById(transactionId).lean();
      if (!tx) return;

      const peelerId = tx.peeler_id.toString();
      const buyerId = tx.buyer_id.toString();
      if (userId !== peelerId && userId !== buyerId) return;

      const counterpartyId = userId === peelerId ? buyerId : peelerId;

      io.to(`user:${counterpartyId}`).emit('LOCATION_UPDATE', {
        transactionId,
        sender_id: userId,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });

      // Auto-expire location sharing after 2 hours
      const timerKey = `${transactionId}:${userId}`;
      if (locationTimers.has(timerKey)) {
        clearTimeout(locationTimers.get(timerKey));
      }
      const timer = setTimeout(() => {
        io.to(`user:${counterpartyId}`).emit('LOCATION_EXPIRED', {
          transactionId,
          sender_id: userId,
        });
        locationTimers.delete(timerKey);
      }, 2 * 60 * 60 * 1000);
      locationTimers.set(timerKey, timer);
    } catch (err) {
      logger.error('SHARE_LOCATION error', { error: err.message });
    }
  });

  // Stop sharing location
  socket.on('LOCATION_STOP', ({ transactionId }) => {
    const timerKey = `${transactionId}:${userId}`;
    if (locationTimers.has(timerKey)) {
      clearTimeout(locationTimers.get(timerKey));
      locationTimers.delete(timerKey);
    }
  });
};

module.exports = setupChatSocket;
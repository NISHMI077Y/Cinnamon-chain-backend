const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET, CLIENT_ORIGIN } = require('../config/env');
const logger = require('../config/logger');
const notificationService = require('../services/notification.service');
const setupBidSocket = require('./bid.socket');
const setupChatSocket = require('./chat.socket');

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('AUTH_ERROR'));
    }
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch {
      return next(new Error('AUTH_ERROR'));
    }
  });

  io.on('connection', (socket) => {
    const { user_id, role } = socket.user;
    logger.info(`Socket connected: ${user_id} (${role})`);

    // Join personal room
    socket.join(`user:${user_id}`);

    setupBidSocket(io, socket);
    setupChatSocket(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user_id}`);
    });

    socket.on('error', (err) => {
      logger.error('Socket error', { user_id, error: err.message });
    });
  });

  notificationService.setIO(io);

  logger.info('Socket.IO initialized');
  return io;
};

module.exports = initSockets;
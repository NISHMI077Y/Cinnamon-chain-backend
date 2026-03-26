let io;

const setIO = (ioInstance) => {
  io = ioInstance;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToPeeler = (peelerId, event, data) => emitToUser(peelerId, event, data);
const emitToBuyer = (buyerId, event, data) => emitToUser(buyerId, event, data);

const emitToTransaction = (transactionId, event, data) => {
  if (io) {
    io.to(`transaction:${transactionId}`).emit(event, data);
  }
};

module.exports = { setIO, emitToUser, emitToPeeler, emitToBuyer, emitToTransaction };
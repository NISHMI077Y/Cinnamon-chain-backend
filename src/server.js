const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { PORT } = require('./config/env');
const initSockets = require('./sockets');

const server = http.createServer(app);

// Initialise Socket.IO
initSockets(server);

const start = async () => {
  await connectDB();

  server
    .listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`\n🚀 CinnamonChain API running at http://localhost:${PORT}/api/health\n`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`   Fix: Change PORT in .env or kill the other process:\n`);
        console.error(`   Windows:  netstat -ano | findstr :${PORT}`);
        console.error(`             taskkill /PID <PID> /F\n`);
        console.error(`   Mac/Linux: lsof -i :${PORT}`);
        console.error(`              kill -9 <PID>\n`);
        process.exit(1);
      }
      throw err;
    });
};

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION', { message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', { message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});

start();
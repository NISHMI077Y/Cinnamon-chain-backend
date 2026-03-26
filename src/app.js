const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { CLIENT_ORIGIN } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Route imports — with debug checks
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const listingRoutes = require('./routes/listing.routes');
const bidRoutes = require('./routes/bid.routes');
const transactionRoutes = require('./routes/transaction.routes');
const labRoutes = require('./routes/lab.routes');
const peelerRoutes = require('./routes/peeler.routes');
const reviewRoutes = require('./routes/review.routes');

// ── Debug: find which module is broken ──
const routes = {
  authRoutes,
  adminRoutes,
  listingRoutes,
  bidRoutes,
  transactionRoutes,
  labRoutes,
  peelerRoutes,
  reviewRoutes,
};

Object.entries(routes).forEach(([name, handler]) => {
  if (typeof handler !== 'function') {
    console.error(`❌ ${name} is NOT a function. Type: ${typeof handler}, Value:`, handler);
  } else {
    console.log(`✅ ${name} loaded OK`);
  }
});

const middlewares = { requestLogger, errorHandler, generalLimiter };
Object.entries(middlewares).forEach(([name, handler]) => {
  if (typeof handler !== 'function') {
    console.error(`❌ Middleware ${name} is NOT a function. Type: ${typeof handler}`);
  } else {
    console.log(`✅ Middleware ${name} loaded OK`);
  }
});

const app = express();

// ── Security ──
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
app.use(requestLogger);

// ── Global rate limit ──
app.use('/api', generalLimiter);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    data: { message: 'CinnamonChain API is running' },
  });
});

// ── Routes (safe mount — skip broken ones) ──
const mountRoute = (path, handler, name) => {
  if (typeof handler === 'function') {
    app.use(path, handler);
    console.log(`✅ Mounted ${path}`);
  } else {
    console.error(`❌ Skipping ${path} — ${name} is not a valid router`);
  }
};

mountRoute('/api/auth', authRoutes, 'authRoutes');
mountRoute('/api/admin', adminRoutes, 'adminRoutes');
mountRoute('/api/listings', listingRoutes, 'listingRoutes');
mountRoute('/api/bids', bidRoutes, 'bidRoutes');
mountRoute('/api/transactions', transactionRoutes, 'transactionRoutes');
mountRoute('/api/lab', labRoutes, 'labRoutes');
mountRoute('/api/peelers', peelerRoutes, 'peelerRoutes');
mountRoute('/api', reviewRoutes, 'reviewRoutes');

// ── 404 ──
app.all('*', (req, _res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// ── Global error handler (must be last) ──
app.use(errorHandler);

module.exports = app;
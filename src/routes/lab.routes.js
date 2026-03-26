const router = require('express').Router();
const labCtrl = require('../controllers/lab.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { uploadPDF } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post(
  '/listings/:listingId/request',
  authenticate,
  authorize('PEELER'),
  labCtrl.requestLabTest
);

router.post(
  '/listings/:listingId/results',
  authenticate,
  authorize('LAB_TECHNICIAN'),
  uploadLimiter,
  uploadPDF,
  labCtrl.submitResults
);

router.get(
  '/listings/:listingId/verify',
  authenticate,
  labCtrl.verifyBlockchainHash
);

module.exports = router;
const router = require('express').Router();
const listingCtrl = require('../controllers/listing.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uploadImages } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const schemas = require('../validators/listing.validator');

// Public: browse published listings
router.get('/', listingCtrl.getListings);
router.get('/:listingId', listingCtrl.getListing);

// Peeler: manage own listings
router.post(
  '/',
  authenticate,
  authorize('PEELER'),
  uploadLimiter,
  uploadImages,
  validate(schemas.createListing),
  listingCtrl.createListing
);

router.post(
  '/:listingId/publish',
  authenticate,
  authorize('PEELER'),
  listingCtrl.publishListing
);

router.get(
  '/me/all',
  authenticate,
  authorize('PEELER'),
  listingCtrl.getMyListings
);

module.exports = router;
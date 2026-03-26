const router = require('express').Router();
const reviewCtrl = require('../controllers/review.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { reviewBody } = require('../validators/admin.validator');

router.post(
  '/transactions/:transactionId/review',
  authenticate,
  authorize('PEELER', 'BUYER'),
  validate(reviewBody),
  reviewCtrl.createReview
);

module.exports = router;
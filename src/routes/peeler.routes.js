const router = require('express').Router();
const peelerCtrl = require('../controllers/peeler.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { hirePeeler } = require('../validators/admin.validator');

router.get(
  '/nearby',
  authenticate,
  authorize('PLANTATION_OWNER'),
  peelerCtrl.getNearbyPeelers
);

router.post(
  '/:peelerId/hire',
  authenticate,
  authorize('PLANTATION_OWNER'),
  validate(hirePeeler),
  peelerCtrl.hirePeeler
);

module.exports = router;
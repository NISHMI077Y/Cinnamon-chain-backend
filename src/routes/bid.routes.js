const router = require('express').Router();
const bidCtrl = require('../controllers/bid.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const schemas = require('../validators/bid.validator');

router.use(authenticate);

router.post('/', authorize('BUYER'), validate(schemas.placeBid), bidCtrl.placeBid);
router.patch('/:bidId/accept', authorize('PEELER'), bidCtrl.acceptBid);
router.get('/me', authorize('BUYER'), bidCtrl.getMyBids);

module.exports = router;
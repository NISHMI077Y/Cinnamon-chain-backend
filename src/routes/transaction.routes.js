const router = require('express').Router();
const transactionCtrl = require('../controllers/transaction.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/me', transactionCtrl.getMyTransactions);
router.get('/:transactionId', transactionCtrl.getTransaction);
router.patch('/:transactionId/complete', transactionCtrl.completeTransaction);

module.exports = router;
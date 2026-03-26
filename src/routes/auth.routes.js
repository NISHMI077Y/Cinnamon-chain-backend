const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const schemas = require('../validators/auth.validator');
const { authLimiter, adminAuthLimiter } = require('../middleware/rateLimiter');

router.post('/google', authLimiter, validate(schemas.googleLogin), authCtrl.googleLogin);

router.post('/phone-login', authLimiter, validate(schemas.phoneLogin), authCtrl.phoneLogin);

router.post('/phone-verify', authLimiter, validate(schemas.phoneVerify), authCtrl.phoneVerify);

router.post('/admin/login', adminAuthLimiter, validate(schemas.adminLogin), authCtrl.adminLogin);

router.post(
  '/admin/verify-totp',
  adminAuthLimiter,
  validate(schemas.adminVerifyTotp),
  authCtrl.adminVerifyTotp
);

router.post('/refresh', authLimiter, validate(schemas.refreshToken), authCtrl.refresh);

router.post('/logout', authenticate, validate(schemas.logout), authCtrl.logout);

module.exports = router;
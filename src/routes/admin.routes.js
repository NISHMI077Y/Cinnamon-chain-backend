const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const schemas = require('../validators/admin.validator');

// Debug: check every function before using
console.log('--- admin.routes.js debug ---');
console.log('authenticate:', typeof authenticate);
console.log('authorize:', typeof authorize);
console.log('validate:', typeof validate);
console.log('schemas.createUser:', typeof schemas.createUser);
console.log('schemas.suspendUser:', typeof schemas.suspendUser);
console.log('schemas.getUsers:', typeof schemas.getUsers);
console.log('adminCtrl.createUser:', typeof adminCtrl.createUser);
console.log('adminCtrl.suspendUser:', typeof adminCtrl.suspendUser);
console.log('adminCtrl.getUsers:', typeof adminCtrl.getUsers);
console.log('----------------------------');

router.use(authenticate);
router.use(authorize('SYSTEM_ADMIN'));

router.post('/users', validate(schemas.createUser), adminCtrl.createUser);
router.patch('/users/:userId/suspend', validate(schemas.suspendUser), adminCtrl.suspendUser);
router.get('/users', validate(schemas.getUsers, 'query'), adminCtrl.getUsers);

module.exports = router;
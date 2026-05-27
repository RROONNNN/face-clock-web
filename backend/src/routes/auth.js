const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authController = require('../controllers/authController');
const { loginValidator, refreshValidator } = require('../validators/authValidator');

router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshValidator, authController.refresh);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

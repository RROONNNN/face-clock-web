const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const dashboardController = require('../controllers/dashboardController');

router.get('/present', authenticate, authorize('admin'), dashboardController.getPresentEmployees);

module.exports = router;

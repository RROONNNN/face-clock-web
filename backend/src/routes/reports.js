const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const reportController = require('../controllers/reportController');

router.use(authenticate, authorize('admin'));

router.get('/monthly', reportController.monthlyReport);
router.get('/employee/:id', reportController.employeeReport);

module.exports = router;

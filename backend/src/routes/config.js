const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const configController = require('../controllers/configController');

router.use(authenticate, authorize('admin'));

router.get('/geofence', configController.getGeofence);
router.put('/geofence', configController.setGeofence);

module.exports = router;

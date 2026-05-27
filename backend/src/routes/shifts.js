const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const shiftController = require('../controllers/shiftController');

router.use(authenticate, authorize('admin'));

router.post('/', shiftController.create);
router.get('/', shiftController.list);
router.put('/:id', shiftController.update);
router.put('/:id/activate', shiftController.activate);
router.delete('/:id', shiftController.remove);

module.exports = router;

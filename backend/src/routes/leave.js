const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const leaveController = require('../controllers/leaveController');
const { createLeaveValidator } = require('../validators/leaveValidator');

router.post('/', authenticate, createLeaveValidator, leaveController.create);
router.get('/', authenticate, authorize('admin'), leaveController.list);
router.put('/:id/approve', authenticate, authorize('admin'), leaveController.approve);
router.put('/:id/reject', authenticate, authorize('admin'), leaveController.reject);

module.exports = router;

const express = require('express');
const router = express.Router();
const attendanceCtrl = require('../controllers/attendanceController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { checkInOutValidator } = require('../validators/attendanceValidator');

router.post('/checkIn', authenticate, checkInOutValidator, attendanceCtrl.checkIn);
router.post('/checkOut', authenticate, checkInOutValidator, attendanceCtrl.checkOut);
router.post('/sync/checkIn', authenticate, attendanceCtrl.syncCheckIn);
router.post('/sync/checkOut', authenticate, attendanceCtrl.syncCheckOut);

router.get('/', authenticate, authorize('admin'), attendanceCtrl.listAttendance);
router.post('/manual', authenticate, authorize('admin'), attendanceCtrl.manualCreate);
router.put('/:id', authenticate, authorize('admin'), attendanceCtrl.updateRecord);
router.delete('/:id', authenticate, authorize('admin'), attendanceCtrl.deleteRecord);

module.exports = router;

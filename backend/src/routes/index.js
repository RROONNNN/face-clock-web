const express = require('express');
const router = express.Router();

// health or root
router.get('/', (req, res) => res.json({ success: true, message: 'API root' }));

const authRouter = require('./auth');
router.use('/auth', authRouter);

const employeeRouter = require('./employees');
router.use('/employees', employeeRouter);

const shiftRouter = require('./shifts');
router.use('/shifts', shiftRouter);

const configRouter = require('./config');
router.use('/config', configRouter);

// attendance
const attendanceRouter = require('./attendance');
router.use('/attendance', attendanceRouter);

const faceRouter = require('./face');
router.use('/face', faceRouter);

const leaveRouter = require('./leave');
router.use('/leave', leaveRouter);

const reportRouter = require('./reports');
router.use('/reports', reportRouter);

const dashboardRouter = require('./dashboard');
router.use('/dashboard', dashboardRouter);

module.exports = router;

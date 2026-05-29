import { Router, Request, Response } from 'express';

const router = Router();

// health or root
router.get('/', (_req: Request, res: Response) => res.json({ success: true, message: 'API root' }));

import authRouter from './auth';
router.use('/auth', authRouter);

import employeeRouter from './employees';
router.use('/employees', employeeRouter);

import shiftRouter from './shifts';
router.use('/shifts', shiftRouter);

import configRouter from './config';
router.use('/config', configRouter);

// attendance
import attendanceRouter from './attendance';
router.use('/attendance', attendanceRouter);

import faceRouter from './face';
router.use('/face', faceRouter);

import leaveRouter from './leave';
router.use('/leave', leaveRouter);

import reportRouter from './reports';
router.use('/reports', reportRouter);

import dashboardRouter from './dashboard';
router.use('/dashboard', dashboardRouter);

export default router;

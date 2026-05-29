import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as leaveController from '../controllers/leaveController';
import { createLeaveValidator } from '../validators/leaveValidator';

const router = Router();

router.post('/', authenticate, createLeaveValidator, leaveController.create);
router.get('/', authenticate, authorize('admin'), leaveController.list);
router.put('/:id/approve', authenticate, authorize('admin'), leaveController.approve);
router.put('/:id/reject', authenticate, authorize('admin'), leaveController.reject);

export default router;

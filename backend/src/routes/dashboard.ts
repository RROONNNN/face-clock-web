import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.get('/present', authenticate, authorize('admin'), dashboardController.getPresentEmployees);

export default router;

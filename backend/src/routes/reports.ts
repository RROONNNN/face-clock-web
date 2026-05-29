import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as reportController from '../controllers/reportController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/monthly', reportController.monthlyReport);
router.get('/employee/:id', reportController.employeeReport);

export default router;

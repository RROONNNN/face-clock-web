import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as shiftController from '../controllers/shiftController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', shiftController.create);
router.get('/', shiftController.list);
router.put('/:id', shiftController.update);
router.put('/:id/activate', shiftController.activate);
router.delete('/:id', shiftController.remove);

export default router;

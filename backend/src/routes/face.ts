import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as faceController from '../controllers/faceController';

const router = Router();

router.put('/employee/:empId', authenticate, faceController.updateFace);
router.post('/sync', authenticate, faceController.syncFaceData);
router.get('/', authenticate, authorize('admin'), faceController.listFaceData);
router.delete('/:empId', authenticate, authorize('admin'), faceController.deleteFaceData);

export default router;

import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as configController from '../controllers/configController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/geofence', configController.getGeofence);
router.put('/geofence', configController.setGeofence);

export default router;

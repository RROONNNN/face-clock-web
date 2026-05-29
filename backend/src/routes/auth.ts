import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import * as authController from '../controllers/authController';
import { loginValidator, refreshValidator } from '../validators/authValidator';

const router = Router();

router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshValidator, authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;

import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import * as employeeController from '../controllers/employeeController';
import { createEmployeeValidator, updateEmployeeValidator } from '../validators/employeeValidator';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', createEmployeeValidator, employeeController.create);
router.get('/', employeeController.list);
router.get('/:id', employeeController.getOne);
router.put('/:id', updateEmployeeValidator, employeeController.update);

export default router;

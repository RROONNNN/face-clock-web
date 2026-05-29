import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { checkInOutValidator } from '../validators/attendanceValidator';

// Note: attendanceController does not exist yet in the JS codebase either.
// Importing as placeholder — controller needs to be created separately.
// import * as attendanceCtrl from '../controllers/attendanceController';

const router = Router();

// These routes reference an attendanceController that doesn't exist yet.
// Uncomment when attendanceController.ts is created:
// router.post('/checkIn', authenticate, checkInOutValidator, attendanceCtrl.checkIn);
// router.post('/checkOut', authenticate, checkInOutValidator, attendanceCtrl.checkOut);
// router.post('/sync/checkIn', authenticate, attendanceCtrl.syncCheckIn);
// router.post('/sync/checkOut', authenticate, attendanceCtrl.syncCheckOut);
// router.get('/', authenticate, authorize('admin'), attendanceCtrl.listAttendance);
// router.post('/manual', authenticate, authorize('admin'), attendanceCtrl.manualCreate);
// router.put('/:id', authenticate, authorize('admin'), attendanceCtrl.updateRecord);
// router.delete('/:id', authenticate, authorize('admin'), attendanceCtrl.deleteRecord);

// Suppress unused import warnings — these are used in the commented routes above
void authenticate;
void authorize;
void checkInOutValidator;

export default router;

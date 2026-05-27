const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const faceController = require('../controllers/faceController');

router.put('/employee/:empId', authenticate, faceController.updateFace);
router.post('/sync', authenticate, faceController.syncFaceData);
router.get('/', authenticate, authorize('admin'), faceController.listFaceData);
router.delete('/:empId', authenticate, authorize('admin'), faceController.deleteFaceData);

module.exports = router;

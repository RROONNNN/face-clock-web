const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const employeeController = require('../controllers/employeeController');
const { createEmployeeValidator, updateEmployeeValidator } = require('../validators/employeeValidator');

router.use(authenticate, authorize('admin'));

router.post('/', createEmployeeValidator, employeeController.create);
router.get('/', employeeController.list);
router.get('/:id', employeeController.getOne);
router.put('/:id', updateEmployeeValidator, employeeController.update);

module.exports = router;

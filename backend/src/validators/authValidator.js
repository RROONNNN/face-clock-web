const { body } = require('express-validator');

const loginValidator = [
  body('employeeCode').notEmpty().withMessage('employeeCode is required'),
  body('password').notEmpty().withMessage('password is required'),
];

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
];

module.exports = {
  loginValidator,
  refreshValidator,
};

const { body } = require('express-validator');

const createEmployeeValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email is invalid'),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('dateOfBirth must be ISO8601 date'),
];

const updateEmployeeValidator = [
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email is invalid'),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('dateOfBirth must be ISO8601 date'),
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator,
};

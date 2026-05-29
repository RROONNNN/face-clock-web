import { body, ValidationChain } from 'express-validator';

export const createEmployeeValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email is invalid'),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('dateOfBirth must be ISO8601 date'),
];

export const updateEmployeeValidator: ValidationChain[] = [
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email is invalid'),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('dateOfBirth must be ISO8601 date'),
];

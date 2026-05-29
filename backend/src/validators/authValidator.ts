import { body, ValidationChain } from 'express-validator';

export const loginValidator: ValidationChain[] = [
  body('employeeCode').notEmpty().withMessage('employeeCode is required'),
  body('password').notEmpty().withMessage('password is required'),
];

export const refreshValidator: ValidationChain[] = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
];

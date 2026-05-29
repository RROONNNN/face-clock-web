import { body, ValidationChain } from 'express-validator';

export const checkInOutValidator: ValidationChain[] = [
  body('empId').notEmpty().withMessage('empId is required'),
  body('time').isISO8601().withMessage('time must be ISO8601'),
  body('lat').isFloat().withMessage('lat must be number'),
  body('lon').isFloat().withMessage('lon must be number'),
];

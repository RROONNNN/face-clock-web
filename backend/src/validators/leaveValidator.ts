import { body, ValidationChain } from 'express-validator';

export const createLeaveValidator: ValidationChain[] = [
  body('startDate').isISO8601().withMessage('startDate must be ISO8601 date'),
  body('endDate').isISO8601().withMessage('endDate must be ISO8601 date'),
  body('reason').optional({ values: 'falsy' }).isString(),
  body('endDate').custom((value, { req }) => {
    if (new Date(value) < new Date(req.body.startDate)) {
      throw new Error('endDate must be greater than or equal to startDate');
    }
    return true;
  }),
];

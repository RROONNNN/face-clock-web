import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

export default function throwIfValidationFails(req: Request, res: Response): Response | null {
  const result = validationResult(req);
  if (result.isEmpty()) return null;

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((item) => ({
      field: item.type === 'field' ? item.path : '',
      message: item.msg,
    })),
  });
}

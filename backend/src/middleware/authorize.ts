import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export default function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return next();
  };
}

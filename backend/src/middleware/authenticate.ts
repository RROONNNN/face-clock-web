import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { AuthenticatedRequest } from '../types';

interface JwtPayload {
  id: string;
  role: string;
}

function extractBearerToken(authorizationHeader: string = ''): string | null {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export default function authenticate(req: Request, res: Response, next: NextFunction): Response | void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

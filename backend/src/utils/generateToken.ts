import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Types } from 'mongoose';

export const generateToken = (userId: Types.ObjectId | string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' },
  );
};

/**
 * Generates an opaque refresh token (64-char hex string).
 * Returns both the raw token (to send to client) and its SHA-256 hash (to store in DB).
 */
export const generateRefreshToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHmac('sha256', process.env.REFRESH_TOKEN_SECRET!).update(raw).digest('hex');
  return { raw, hash };
};

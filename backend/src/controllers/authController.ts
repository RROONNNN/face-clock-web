import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import throwIfValidationFails from '../utils/validationResult';
import { generateToken, generateRefreshToken } from '../utils/generateToken';
import { AuthenticatedRequest } from '../types';

function safeUser(user: IUser) {
  return {
    id: user._id,
    employeeCode: user.employeeCode,
    name: user.name,
    role: user.accountRole,
  };
}

export const login = async (req: Request, res: Response): Promise<Response | void> => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const { employeeCode, password } = req.body;
  const user = await User.findOne({ employeeCode });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const accessToken = generateToken(String(user._id), user.accountRole);
  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
  user.refreshTokenHash = refreshTokenHash;
  await user.save();

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: safeUser(user),
    },
  });
};

export const refresh = async (req: Request, res: Response): Promise<Response | void> => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const { refreshToken } = req.body;
  const refreshTokenHash = crypto
    .createHmac('sha256', process.env.REFRESH_TOKEN_SECRET!)
    .update(refreshToken)
    .digest('hex');

  const user = await User.findOne({ refreshTokenHash });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  const accessToken = generateToken(String(user._id), user.accountRole);
  return res.json({ success: true, data: { accessToken } });
};

export const logout = async (req: Request, res: Response): Promise<Response | void> => {
  const authReq = req as AuthenticatedRequest;
  await User.findByIdAndUpdate(authReq.user.id, { refreshTokenHash: null });
  return res.json({ success: true, message: 'Logged out successfully' });
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import throwIfValidationFails from '../utils/validationResult';

interface SanitizedUser {
  [key: string]: unknown;
}

function sanitize(user: IUser): SanitizedUser {
  const obj: SanitizedUser = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  return obj;
}

export const create = async (req: Request, res: Response): Promise<Response | void> => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const payload = {
    name: req.body.name,
    department: req.body.department,
    jobTitle: req.body.jobTitle,
    phone: req.body.phone,
    email: req.body.email,
    dateOfBirth: req.body.dateOfBirth,
  };

  const user = new User(payload);
  await user.save();

  user.passwordHash = await bcrypt.hash(user.employeeCode, 10);
  await user.save();

  return res.status(201).json({ success: true, data: sanitize(user) });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.department) query.department = req.query.department;
  if (req.query.search) {
    const pattern = new RegExp(req.query.search as string, 'i');
    query.$or = [{ name: pattern }, { employeeCode: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return res.json({
    success: true,
    data: items.map(sanitize),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  return res.json({ success: true, data: sanitize(user) });
};

export const update = async (req: Request, res: Response): Promise<Response | void> => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const allowed = ['name', 'department', 'jobTitle', 'phone', 'email', 'dateOfBirth'] as const;
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updateData[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  return res.json({ success: true, data: sanitize(user) });
};

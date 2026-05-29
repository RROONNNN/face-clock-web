import { Request, Response } from 'express';
import Shift from '../models/Shift';

export const create = async (req: Request, res: Response): Promise<Response> => {
  const shift = await Shift.create({
    name: req.body.name,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });
  return res.status(201).json({ success: true, data: shift });
};

export const list = async (_req: Request, res: Response): Promise<Response> => {
  const shifts = await Shift.find().sort({ createdAt: -1 });
  return res.json({ success: true, data: shifts });
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const updateData: Record<string, unknown> = {};
  for (const key of ['name', 'startTime', 'endTime'] as const) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updateData[key] = req.body[key];
    }
  }

  const shift = await Shift.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

  return res.json({ success: true, data: shift });
};

export const activate = async (req: Request, res: Response): Promise<Response> => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

  await Shift.updateMany({}, { $set: { isActive: false } });
  shift.isActive = true;
  await shift.save();

  return res.json({ success: true, data: shift });
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
  if (shift.isActive) {
    return res.status(400).json({ success: false, message: 'Cannot delete active shift' });
  }

  await shift.deleteOne();
  return res.json({ success: true, message: 'Shift deleted' });
};

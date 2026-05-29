import { Request, Response } from 'express';
import CheckIn from '../models/CheckIn';

function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const getPresentEmployees = async (_req: Request, res: Response): Promise<Response> => {
  const start = startOfDayUTC(new Date());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const data = await CheckIn.find({
    time: { $gte: start, $lt: end },
  })
    .populate('employeeId', 'name employeeCode department')
    .sort({ time: -1 });

  return res.json({ success: true, data });
};

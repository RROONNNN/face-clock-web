import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import throwIfValidationFails from '../utils/validationResult';
import { AuthenticatedRequest } from '../types';

export const create = async (req: Request, res: Response): Promise<Response | void> => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const authReq = req as AuthenticatedRequest;
  const leave = await LeaveRequest.create({
    employeeId: authReq.user.id,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    reason: req.body.reason,
    status: 'pending',
  });

  return res.status(201).json({ success: true, data: leave });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.empId) query.employeeId = req.query.empId;

  const [data, total] = await Promise.all([
    LeaveRequest.find(query)
      .populate('employeeId', 'employeeCode name department')
      .populate('reviewedBy', 'employeeCode name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(query),
  ]);

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const approve = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave can be approved' });
  }

  leave.status = 'approved';
  leave.reviewedBy = authReq.user.id as unknown as typeof leave.reviewedBy;
  leave.reviewedAt = new Date();
  await leave.save();

  return res.json({ success: true, data: leave });
};

export const reject = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave can be rejected' });
  }

  leave.status = 'rejected';
  leave.reviewedBy = authReq.user.id as unknown as typeof leave.reviewedBy;
  leave.reviewedAt = new Date();
  await leave.save();

  return res.json({ success: true, data: leave });
};

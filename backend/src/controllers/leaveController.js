const LeaveRequest = require('../models/LeaveRequest');
const throwIfValidationFails = require('../utils/validationResult');

exports.create = async (req, res) => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const leave = await LeaveRequest.create({
    employeeId: req.user.id,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    reason: req.body.reason,
    status: 'pending',
  });

  return res.status(201).json({ success: true, data: leave });
};

exports.list = async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const query = {};
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

exports.approve = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave can be approved' });
  }

  leave.status = 'approved';
  leave.reviewedBy = req.user.id;
  leave.reviewedAt = new Date();
  await leave.save();

  return res.json({ success: true, data: leave });
};

exports.reject = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave can be rejected' });
  }

  leave.status = 'rejected';
  leave.reviewedBy = req.user.id;
  leave.reviewedAt = new Date();
  await leave.save();

  return res.json({ success: true, data: leave });
};

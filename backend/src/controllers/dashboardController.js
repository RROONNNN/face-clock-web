const Attendance = require('../models/Attendance');

function startOfDayUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

exports.getPresentEmployees = async (req, res) => {
  const start = startOfDayUTC(new Date());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const data = await Attendance.find({
    workDate: { $gte: start, $lt: end },
    checkIn: { $ne: null },
    checkOut: null,
  })
    .populate('employeeId', 'name employeeCode department')
    .sort({ 'checkIn.time': -1 });

  return res.json({ success: true, data });
};

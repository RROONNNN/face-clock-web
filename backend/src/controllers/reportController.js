const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

function getMonthRange(monthStr) {
  const [year, month] = monthStr.split('-').map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function calculateWorkHours(attendance) {
  if (!attendance.checkIn?.time || !attendance.checkOut?.time) return 0;
  const ms = new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time);
  if (ms <= 0) return 0;
  return ms / 1000 / 3600;
}

function toMinutesFromDate(dateInput) {
  const date = new Date(dateInput);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function toMinutesFromShiftTime(shiftTime) {
  if (!shiftTime) return null;
  const [h, m] = shiftTime.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isLate(att) {
  if (!att.checkIn?.time || !att.shiftId?.startTime) return false;
  const shiftStart = toMinutesFromShiftTime(att.shiftId.startTime);
  if (shiftStart === null) return false;
  return toMinutesFromDate(att.checkIn.time) > shiftStart;
}

function isEarly(att) {
  if (!att.checkOut?.time || !att.shiftId?.endTime) return false;
  const shiftEnd = toMinutesFromShiftTime(att.shiftId.endTime);
  if (shiftEnd === null) return false;
  return toMinutesFromDate(att.checkOut.time) < shiftEnd;
}

async function buildMonthlyReport(month, empId) {
  const { start, end } = getMonthRange(month);
  const attendanceQuery = { workDate: { $gte: start, $lt: end } };
  if (empId) attendanceQuery.employeeId = empId;

  const attendanceList = await Attendance.find(attendanceQuery)
    .populate('employeeId', 'employeeCode name department')
    .populate('shiftId', 'startTime endTime');

  const map = new Map();
  for (const item of attendanceList) {
    const employeeId = String(item.employeeId?._id || item.employeeId);
    if (!map.has(employeeId)) {
      map.set(employeeId, {
        employeeId,
        employee: item.employeeId,
        totalWorkDays: 0,
        totalWorkHours: 0,
        lateCount: 0,
        earlyLeaveCount: 0,
        outOfZoneCount: 0,
        leaveDays: 0,
      });
    }

    const row = map.get(employeeId);
    if (item.checkIn?.time) row.totalWorkDays += 1;
    row.totalWorkHours += calculateWorkHours(item);
    if (isLate(item)) row.lateCount += 1;
    if (isEarly(item)) row.earlyLeaveCount += 1;
    if (item.checkIn?.isOutOfZone) row.outOfZoneCount += 1;
  }

  const leaveQuery = {
    status: 'approved',
    startDate: { $lt: end },
    endDate: { $gte: start },
  };
  if (empId) leaveQuery.employeeId = empId;

  const leaveList = await LeaveRequest.find(leaveQuery);
  for (const leave of leaveList) {
    const employeeId = String(leave.employeeId);
    if (!map.has(employeeId)) {
      map.set(employeeId, {
        employeeId,
        employee: null,
        totalWorkDays: 0,
        totalWorkHours: 0,
        lateCount: 0,
        earlyLeaveCount: 0,
        outOfZoneCount: 0,
        leaveDays: 0,
      });
    }

    const row = map.get(employeeId);
    const leaveStart = leave.startDate < start ? start : leave.startDate;
    const leaveEnd = leave.endDate > end ? end : leave.endDate;
    const diffDays = Math.max(Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1, 0);
    row.leaveDays += diffDays;
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    totalWorkHours: Number(item.totalWorkHours.toFixed(2)),
  }));
}

exports.monthlyReport = async (req, res) => {
  const { month, empId } = req.query;
  if (!month) {
    return res.status(400).json({ success: false, message: 'month query is required in YYYY-MM format' });
  }

  const data = await buildMonthlyReport(month, empId);
  return res.json({ success: true, data });
};

exports.employeeReport = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ success: false, message: 'month query is required in YYYY-MM format' });
  }

  const data = await buildMonthlyReport(month, req.params.id);
  return res.json({ success: true, data: data[0] || null });
};

import { Request, Response } from 'express';
import CheckIn from '../models/CheckIn';
import CheckOut from '../models/CheckOut';
import LeaveRequest from '../models/LeaveRequest';

interface AttendanceRecord {
  checkIn?: { time: Date; isOutOfZone?: boolean };
  checkOut?: { time: Date };
  shiftId?: { startTime: string; endTime: string };
  employeeId?: { _id: string } | string;
}

interface ReportRow {
  employeeId: string;
  employee: unknown;
  totalWorkDays: number;
  totalWorkHours: number;
  lateCount: number;
  earlyLeaveCount: number;
  outOfZoneCount: number;
  leaveDays: number;
}

function getMonthRange(monthStr: string): { start: Date; end: Date } {
  const [year, month] = monthStr.split('-').map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function calculateWorkHours(checkInTime: Date | undefined, checkOutTime: Date | undefined): number {
  if (!checkInTime || !checkOutTime) return 0;
  const ms = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
  if (ms <= 0) return 0;
  return ms / 1000 / 3600;
}

function toMinutesFromDate(dateInput: Date): number {
  const date = new Date(dateInput);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function toMinutesFromShiftTime(shiftTime: string | undefined): number | null {
  if (!shiftTime) return null;
  const [h, m] = shiftTime.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isLate(att: AttendanceRecord): boolean {
  if (!att.checkIn?.time || !att.shiftId?.startTime) return false;
  const shiftStart = toMinutesFromShiftTime(att.shiftId.startTime);
  if (shiftStart === null) return false;
  return toMinutesFromDate(att.checkIn.time) > shiftStart;
}

function isEarly(att: AttendanceRecord): boolean {
  if (!att.checkOut?.time || !att.shiftId?.endTime) return false;
  const shiftEnd = toMinutesFromShiftTime(att.shiftId.endTime);
  if (shiftEnd === null) return false;
  return toMinutesFromDate(att.checkOut.time) < shiftEnd;
}

async function buildMonthlyReport(month: string, empId?: string): Promise<ReportRow[]> {
  const { start, end } = getMonthRange(month);

  const checkInQuery: Record<string, unknown> = { time: { $gte: start, $lt: end } };
  if (empId) checkInQuery.employeeId = empId;

  const checkIns = await CheckIn.find(checkInQuery)
    .populate('employeeId', 'employeeCode name department');

  const checkOuts = await CheckOut.find({
    time: { $gte: start, $lt: end },
    ...(empId ? { employeeId: empId } : {}),
  });

  // Build a map of checkOuts by employeeId+date for matching
  const checkOutMap = new Map<string, typeof checkOuts[0]>();
  for (const co of checkOuts) {
    const dateKey = `${co.employeeId}_${new Date(co.time).toISOString().split('T')[0]}`;
    checkOutMap.set(dateKey, co);
  }

  const map = new Map<string, ReportRow>();
  for (const item of checkIns) {
    const employeeId = String(item.employeeId && typeof item.employeeId === 'object' && '_id' in item.employeeId
      ? (item.employeeId as unknown as { _id: string })._id
      : item.employeeId);

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

    const row = map.get(employeeId)!;
    row.totalWorkDays += 1;

    const dateKey = `${item.employeeId}_${new Date(item.time).toISOString().split('T')[0]}`;
    const matchingCheckOut = checkOutMap.get(dateKey);

    const att: AttendanceRecord = {
      checkIn: { time: item.time },
      checkOut: matchingCheckOut ? { time: matchingCheckOut.time } : undefined,
    };

    row.totalWorkHours += calculateWorkHours(att.checkIn?.time, att.checkOut?.time);
    if (isLate(att)) row.lateCount += 1;
    if (isEarly(att)) row.earlyLeaveCount += 1;
  }

  const leaveQuery: Record<string, unknown> = {
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

    const row = map.get(employeeId)!;
    const leaveStart = leave.startDate < start ? start : leave.startDate;
    const leaveEnd = leave.endDate > end ? end : leave.endDate;
    const diffDays = Math.max(Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1, 0);
    row.leaveDays += diffDays;
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    totalWorkHours: Number(item.totalWorkHours.toFixed(2)),
  }));
}

export const monthlyReport = async (req: Request, res: Response): Promise<Response> => {
  const { month, empId } = req.query as { month?: string; empId?: string };
  if (!month) {
    return res.status(400).json({ success: false, message: 'month query is required in YYYY-MM format' });
  }

  const data = await buildMonthlyReport(month, empId);
  return res.json({ success: true, data });
};

export const employeeReport = async (req: Request, res: Response): Promise<Response> => {
  const { month } = req.query as { month?: string };
  if (!month) {
    return res.status(400).json({ success: false, message: 'month query is required in YYYY-MM format' });
  }

  const data = await buildMonthlyReport(month, req.params.id as string);
  return res.json({ success: true, data: data[0] || null });
};

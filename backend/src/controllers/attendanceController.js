const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ProcessedEvent = require('../models/ProcessedEvent');
const Shift = require('../models/Shift');
const GeoConfig = require('../models/GeoConfig');
const { isWithinZone } = require('../utils/geoUtils');
const throwIfValidationFails = require('../utils/validationResult');

function startOfDayUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}


async function markProcessed(eventId, meta = {}) {
  if (!eventId) return null;
  try {
    const doc = new ProcessedEvent({ eventId, ...meta });
    await doc.save();
    return doc;
  } catch (err) {
    // duplicate key -> already processed
    return null;
  }
}

async function ensureAttendance(employeeId, workDate, shiftId = null) {
  const dateKey = startOfDayUTC(workDate);
  const q = { employeeId, workDate: dateKey };
  let att = await Attendance.findOne(q);
  if (!att) {
    att = await Attendance.create({ employeeId, workDate: dateKey, shiftId });
  } else if (shiftId && !att.shiftId) {
    att.shiftId = shiftId;
    await att.save();
  }
  return att;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return value.toLowerCase() === 'true';
}

function getMinutesFromDate(input) {
  const d = new Date(input);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function getMinutesFromShiftTime(shiftTime) {
  if (!shiftTime || typeof shiftTime !== 'string') return null;
  const [hours, minutes] = shiftTime.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isLateCheckIn(checkInTime, shift) {
  if (!checkInTime || !shift) return false;
  const checkInMinutes = getMinutesFromDate(checkInTime);
  const shiftStartMinutes = getMinutesFromShiftTime(shift.startTime);
  if (shiftStartMinutes === null) return false;
  return checkInMinutes > shiftStartMinutes;
}

function isEarlyCheckOut(checkOutTime, shift) {
  if (!checkOutTime || !shift) return false;
  const checkOutMinutes = getMinutesFromDate(checkOutTime);
  const shiftEndMinutes = getMinutesFromShiftTime(shift.endTime);
  if (shiftEndMinutes === null) return false;
  return checkOutMinutes < shiftEndMinutes;
}

async function getCurrentShift() {
  return Shift.findOne({ isActive: true });
}

async function handleEvent(event, type) {
  const { empId, time, lat, lon, imagePath, localId } = event;
  if (!empId || !time) throw new Error('empId and time required');
  // idempotency
  if (localId) {
    const existing = await ProcessedEvent.findOne({ eventId: localId });
    if (existing) return { skipped: true };
  }

  const user = await User.findById(empId);
  if (!user) throw new Error('employee not found');

  const [shift, geoConfig] = await Promise.all([getCurrentShift(), GeoConfig.findOne().sort({ updatedAt: -1 })]);
  const workDate = startOfDayUTC(time);
  const att = await ensureAttendance(empId, workDate, shift ? shift._id : null);

  const numericLat = Number(lat);
  const numericLon = Number(lon);
  const outOfZone = Number.isFinite(numericLat) && Number.isFinite(numericLon)
    ? !isWithinZone(numericLat, numericLon, geoConfig)
    : false;

  const payload = {
    time,
    latitude: numericLat,
    longitude: numericLon,
    imagePath: imagePath || null,
    localId,
    isOutOfZone: outOfZone,
  };

  if (type === 'checkin') {
    att.checkIn = payload;
    att.status = att.checkOut ? 'present' : 'partial';
  } else if (type === 'checkout') {
    att.checkOut = payload;
    att.status = att.checkIn ? 'present' : 'partial';
  }

  if (localId && !att.processedLocalIds.includes(localId)) att.processedLocalIds.push(localId);

  await att.save();
  if (localId) await markProcessed(localId, { employeeId: empId, type });

  return { attendance: att.toObject(), skipped: false, user };
}

exports.checkIn = async (req, res) => {
  try {
    const invalid = throwIfValidationFails(req, res);
    if (invalid) return invalid;
    const { empId, time, lat, lon, imagePath, localId } = req.body;
    const result = await handleEvent({ empId, time, lat, lon, imagePath, localId }, 'checkin');
    const io = req.app.get('io');
    if (!result.skipped && io) {
      io.to('admin').emit('attendance:update', {
        type: 'checkIn',
        employeeId: empId,
        time,
        name: result.user.name,
      });
    }
    if (result.skipped) return res.json({ success: true, message: 'already processed' });
    return res.json({ success: true, data: result.attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const invalid = throwIfValidationFails(req, res);
    if (invalid) return invalid;
    const { empId, time, lat, lon, imagePath, localId } = req.body;
    const result = await handleEvent({ empId, time, lat, lon, imagePath, localId }, 'checkout');
    const io = req.app.get('io');
    if (!result.skipped && io) {
      io.to('admin').emit('attendance:update', {
        type: 'checkOut',
        employeeId: empId,
        time,
        name: result.user.name,
      });
    }
    if (result.skipped) return res.json({ success: true, message: 'already processed' });
    return res.json({ success: true, data: result.attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.syncCheckIn = async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body.list || [];
    const failed = [];
    for (const item of list) {
      try {
        await handleEvent({
          empId: item.empId,
          time: item.time,
          lat: item.lat,
          lon: item.lon,
          imagePath: item.imagePath,
          localId: item.localId,
        }, 'checkin');
      } catch (e) {
        if (item.localId) failed.push(item.localId);
      }
    }
    return res.json({ success: true, failedLocalIds: failed });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.syncCheckOut = async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body.list || [];
    const failed = [];
    for (const item of list) {
      try {
        await handleEvent({
          empId: item.empId,
          time: item.time,
          lat: item.lat,
          lon: item.lon,
          imagePath: item.imagePath,
          localId: item.localId,
        }, 'checkout');
      } catch (e) {
        if (item.localId) failed.push(item.localId);
      }
    }
    return res.json({ success: true, failedLocalIds: failed });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.manualCreate = async (req, res) => {
  try {
    const { empId, checkInTime, checkOutTime, workDate } = req.body;
    if (!empId || !workDate) {
      return res.status(400).json({ success: false, message: 'empId and workDate required' });
    }

    const user = await User.findById(empId);
    if (!user) return res.status(404).json({ success: false, message: 'employee not found' });

    const shift = await getCurrentShift();
    const attendance = await ensureAttendance(empId, workDate, shift ? shift._id : null);

    if (checkInTime) {
      attendance.checkIn = {
        time: checkInTime,
        latitude: 0,
        longitude: 0,
        method: 'manual',
        localId: null,
        isOutOfZone: false,
      };
    }

    if (checkOutTime) {
      attendance.checkOut = {
        time: checkOutTime,
        latitude: 0,
        longitude: 0,
        method: 'manual',
        localId: null,
        isOutOfZone: false,
      };
    }

    attendance.status = attendance.checkIn && attendance.checkOut ? 'present' : 'partial';
    await attendance.save();

    return res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ success: false, message: 'attendance not found' });

    const fields = ['time', 'latitude', 'longitude'];
    if (req.body.checkIn && attendance.checkIn) {
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(req.body.checkIn, field)) {
          attendance.checkIn[field] = req.body.checkIn[field];
        }
      }
    }

    if (req.body.checkOut && attendance.checkOut) {
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(req.body.checkOut, field)) {
          attendance.checkOut[field] = req.body.checkOut[field];
        }
      }
    }

    attendance.status = attendance.checkIn && attendance.checkOut ? 'present' : 'partial';
    await attendance.save();

    return res.json({ success: true, data: attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ success: false, message: 'attendance not found' });

    return res.json({ success: true, message: 'attendance deleted' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.listAttendance = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.empId) query.employeeId = req.query.empId;

    if (req.query.date) {
      const start = startOfDayUTC(req.query.date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      query.workDate = { $gte: start, $lt: end };
    } else if (req.query.startDate || req.query.endDate) {
      query.workDate = {};
      if (req.query.startDate) query.workDate.$gte = startOfDayUTC(req.query.startDate);
      if (req.query.endDate) {
        const end = startOfDayUTC(req.query.endDate);
        end.setUTCDate(end.getUTCDate() + 1);
        query.workDate.$lt = end;
      }
    }

    const [items, total] = await Promise.all([
      Attendance.find(query)
        .populate('employeeId', 'name employeeCode department')
        .populate('shiftId', 'startTime endTime name')
        .sort({ workDate: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    let data = items;
    if (parseBoolean(req.query.late)) {
      data = data.filter((item) => isLateCheckIn(item.checkIn?.time, item.shiftId));
    }
    if (parseBoolean(req.query.earlyLeave)) {
      data = data.filter((item) => isEarlyCheckOut(item.checkOut?.time, item.shiftId));
    }

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
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

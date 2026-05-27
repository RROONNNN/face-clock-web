const mongoose = require('mongoose');

const subEventSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    imagePath: { type: String, default: null },
    method: { type: String, enum: ['face', 'manual', 'barcode', 'other'], default: 'face' },
    localId: { type: String },
    isOutOfZone: { type: Boolean, default: false },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
    workDate: { type: Date, required: true }, // date normalized to start of day in org timezone
    checkIn: { type: subEventSchema, default: null },
    checkOut: { type: subEventSchema, default: null },
    status: { type: String, enum: ['present', 'absent', 'partial', 'unknown'], default: 'unknown' },
    processedLocalIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, workDate: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

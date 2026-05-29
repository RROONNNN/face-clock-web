import mongoose, { Document, Schema, Types } from 'mongoose';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface ILeaveRequest extends Document {
  employeeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;

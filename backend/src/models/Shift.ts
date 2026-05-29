import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Shift = mongoose.model<IShift>('Shift', shiftSchema);

export default Shift;

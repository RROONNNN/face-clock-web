import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICheckOut extends Document {
  employeeId: Types.ObjectId;
  time: Date;
  imagePath: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

const checkOutSchema = new Schema<ICheckOut>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    imagePath: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const CheckOut = mongoose.model<ICheckOut>('CheckOut', checkOutSchema);

export default CheckOut;

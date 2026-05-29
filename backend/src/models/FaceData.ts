import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFaceData extends Document {
  employeeId: Types.ObjectId;
  updatedTime: Date;
  listFaceEmbedding: number[][];
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const faceDataSchema = new Schema<IFaceData>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    updatedTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    listFaceEmbedding: {
      type: [[Number]],
      required: true,
      default: [],
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const FaceData = mongoose.model<IFaceData>('FaceData', faceDataSchema);

export default FaceData;

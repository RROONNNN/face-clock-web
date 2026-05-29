import mongoose, { Document, Schema } from 'mongoose';

export interface IGeoConfig extends Document {
  centerLat: number;
  centerLon: number;
  radiusMeters: number;
  createdAt: Date;
  updatedAt: Date;
}

const geoConfigSchema = new Schema<IGeoConfig>(
  {
    centerLat: { type: Number, required: true },
    centerLon: { type: Number, required: true },
    radiusMeters: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

const GeoConfig = mongoose.model<IGeoConfig>('GeoConfig', geoConfigSchema);

export default GeoConfig;

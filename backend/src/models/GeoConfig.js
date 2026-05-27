const mongoose = require('mongoose');

const geoConfigSchema = new mongoose.Schema(
  {
    centerLat: { type: Number, required: true },
    centerLon: { type: Number, required: true },
    radiusMeters: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

const GeoConfig = mongoose.model('GeoConfig', geoConfigSchema);

module.exports = GeoConfig;

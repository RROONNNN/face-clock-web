const GeoConfig = require('../models/GeoConfig');

exports.getGeofence = async (req, res) => {
  const config = await GeoConfig.findOne().sort({ updatedAt: -1 });
  if (!config) {
    return res.status(404).json({ success: false, message: 'Geofence config not found' });
  }

  return res.json({ success: true, data: config });
};

exports.setGeofence = async (req, res) => {
  const { centerLat, centerLon, radiusMeters } = req.body;
  const config = await GeoConfig.findOneAndUpdate(
    {},
    { centerLat, centerLon, radiusMeters },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.json({ success: true, data: config });
};

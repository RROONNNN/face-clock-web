import { Request, Response } from 'express';
import GeoConfig from '../models/GeoConfig';

export const getGeofence = async (_req: Request, res: Response): Promise<Response> => {
  const config = await GeoConfig.findOne().sort({ updatedAt: -1 });
  if (!config) {
    return res.status(404).json({ success: false, message: 'Geofence config not found' });
  }

  return res.json({ success: true, data: config });
};

export const setGeofence = async (req: Request, res: Response): Promise<Response> => {
  const { centerLat, centerLon, radiusMeters } = req.body;
  const config = await GeoConfig.findOneAndUpdate(
    {},
    { centerLat, centerLon, radiusMeters },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return res.json({ success: true, data: config });
};

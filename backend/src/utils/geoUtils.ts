import { IGeoConfig } from '../models/GeoConfig';

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function isWithinZone(lat: number, lon: number, geoConfig: IGeoConfig | null): boolean {
  if (!geoConfig) return true;
  const distance = haversineDistance(lat, lon, geoConfig.centerLat, geoConfig.centerLon);
  return distance <= geoConfig.radiusMeters;
}

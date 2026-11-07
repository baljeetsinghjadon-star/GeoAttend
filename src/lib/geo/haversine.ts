/**
 * Haversine Formula Utility
 * Calculates the great-circle distance between two points on the Earth's surface
 * specified by latitude and longitude in decimal degrees.
 */

// Earth's mean radius in meters (WGS84 standard spherical approximation)
export const EARTH_RADIUS_METERS = 6371000;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Converts degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two geographic coordinates in meters.
 *
 * @param point1 - { latitude, longitude } of point 1
 * @param point2 - { latitude, longitude } of point 2
 * @returns Distance in meters (rounded to 2 decimal places)
 */
export function calculateHaversineDistance(
  point1: GeoPoint,
  point2: GeoPoint
): number {
  const lat1Rad = degreesToRadians(point1.latitude);
  const lat2Rad = degreesToRadians(point2.latitude);
  const deltaLatRad = degreesToRadians(point2.latitude - point1.latitude);
  const deltaLngRad = degreesToRadians(point2.longitude - point1.longitude);

  const sinDeltaLat = Math.sin(deltaLatRad / 2);
  const sinDeltaLng = Math.sin(deltaLngRad / 2);

  // Haversine formula
  const a =
    sinDeltaLat * sinDeltaLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDeltaLng * sinDeltaLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;

  // Return distance rounded to 2 decimal places
  return Math.round(distance * 100) / 100;
}

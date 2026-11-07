import { calculateHaversineDistance, GeoPoint } from "./haversine";

export interface GeofenceValidationParams {
  studentLocation: GeoPoint;
  accuracyMeters: number;
  zoneCenter: GeoPoint;
  zoneRadiusMeters: number;
  maxAccuracyThreshold?: number; // Maximum acceptable GPS uncertainty (default: 100m)
}

export interface GeofenceValidationResult {
  isValid: boolean;
  distanceMeters: number;
  zoneRadiusMeters: number;
  metersOutside: number;
  accuracyMeters: number;
  rejectionReason: string | null;
}

export const DEFAULT_MAX_ACCURACY_METERS = 100;

/**
 * Validates a student's location attempt against a geofence zone center and radius.
 */
export function validateGeofence({
  studentLocation,
  accuracyMeters,
  zoneCenter,
  zoneRadiusMeters,
  maxAccuracyThreshold = DEFAULT_MAX_ACCURACY_METERS,
}: GeofenceValidationParams): GeofenceValidationResult {
  // Check 1: GPS Accuracy validation
  if (accuracyMeters > maxAccuracyThreshold) {
    return {
      isValid: false,
      distanceMeters: 0,
      zoneRadiusMeters,
      metersOutside: 0,
      accuracyMeters,
      rejectionReason: `GPS signal accuracy is too weak (±${Math.round(
        accuracyMeters
      )}m). Maximum acceptable margin is ±${maxAccuracyThreshold}m. Please step outdoors or turn on high accuracy GPS.`,
    };
  }

  // Check 2: Haversine distance calculation
  const distanceMeters = calculateHaversineDistance(studentLocation, zoneCenter);

  // Check 3: Is student inside the zone radius?
  if (distanceMeters <= zoneRadiusMeters) {
    return {
      isValid: true,
      distanceMeters,
      zoneRadiusMeters,
      metersOutside: 0,
      accuracyMeters,
      rejectionReason: null,
    };
  }

  // Outside zone
  const metersOutside = Math.round(distanceMeters - zoneRadiusMeters);

  return {
    isValid: false,
    distanceMeters,
    zoneRadiusMeters,
    metersOutside,
    accuracyMeters,
    rejectionReason: `You are outside the classroom geofence by approximately ${metersOutside} meters. Please move closer to the designated zone.`,
  };
}

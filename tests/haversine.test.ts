import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHaversineDistance,
  degreesToRadians,
  EARTH_RADIUS_METERS,
} from "../src/lib/geo/haversine";
import {
  validateGeofence,
  DEFAULT_MAX_ACCURACY_METERS,
} from "../src/lib/geo/validator";

describe("Haversine Formula Distance Calculations", () => {
  test("returns 0 meters for identical points", () => {
    const point = { latitude: 37.7749, longitude: -122.4194 };
    const distance = calculateHaversineDistance(point, point);
    assert.equal(distance, 0);
  });

  test("accurately calculates distance between known landmark coordinates", () => {
    // Trafalgar Square to Big Ben (~850 meters)
    const trafalgarSquare = { latitude: 51.508039, longitude: -0.128069 };
    const bigBen = { latitude: 51.500729, longitude: -0.124625 };

    const distance = calculateHaversineDistance(trafalgarSquare, bigBen);

    // Distance should be ~847 meters within +/- 15m tolerance
    assert.ok(distance > 830 && distance < 865, `Expected ~847m, got ${distance}`);
  });

  test("calculates short distances across university campus accurately", () => {
    // Lecture Hall Center
    const lectureHall = { latitude: 28.545123, longitude: 77.192345 };
    // Point roughly 45 meters south
    const studentInside = { latitude: 28.544718, longitude: 77.192345 };

    const distance = calculateHaversineDistance(lectureHall, studentInside);
    assert.ok(distance > 40 && distance < 50, `Expected ~45m, got ${distance}`);
  });
});

describe("Geofence Validator Engine", () => {
  const zoneCenter = { latitude: 28.545123, longitude: 77.192345 };
  const zoneRadiusMeters = 50;

  test("accepts student who is inside the 50m geofence radius", () => {
    // Student 30 meters away from center with good accuracy
    const studentLocation = { latitude: 28.545393, longitude: 77.192345 };
    const accuracyMeters = 15; // 15m GPS accuracy

    const result = validateGeofence({
      studentLocation,
      accuracyMeters,
      zoneCenter,
      zoneRadiusMeters,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.rejectionReason, null);
    assert.equal(result.metersOutside, 0);
    assert.ok(result.distanceMeters <= zoneRadiusMeters);
  });

  test("rejects student who is 120m away with clear meters outside reason", () => {
    // Student ~120 meters away
    const studentLocation = { latitude: 28.546203, longitude: 77.192345 };
    const accuracyMeters = 10;

    const result = validateGeofence({
      studentLocation,
      accuracyMeters,
      zoneCenter,
      zoneRadiusMeters,
    });

    assert.equal(result.isValid, false);
    assert.ok(result.metersOutside > 65);
    assert.match(
      result.rejectionReason ?? "",
      /You are outside the classroom geofence by approximately \d+ meters/
    );
  });

  test("rejects student with poor GPS accuracy even if center coords are inside", () => {
    const studentLocation = { latitude: 28.545123, longitude: 77.192345 }; // exact center
    const poorAccuracyMeters = 150; // Worse than 100m threshold

    const result = validateGeofence({
      studentLocation,
      accuracyMeters: poorAccuracyMeters,
      zoneCenter,
      zoneRadiusMeters,
      maxAccuracyThreshold: DEFAULT_MAX_ACCURACY_METERS,
    });

    assert.equal(result.isValid, false);
    assert.match(
      result.rejectionReason ?? "",
      /GPS signal accuracy is too weak/
    );
  });
});

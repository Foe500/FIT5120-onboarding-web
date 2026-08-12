import assert from "node:assert/strict";
import test from "node:test";
import { rateRoute } from "./rating.js";

const route = {
  id: "test-route",
  name: "Test route",
  mode: "Direct",
  summary: "Test route summary",
  estimated_walking_time: "5 min",
  walking_time_minutes: 5,
  distance_meters: 400,
  coordinates: [
    [-37.815, 144.9669],
    [-37.811, 144.966]
  ]
};

function sensor(overrides = {}) {
  return {
    location_id: 1,
    sensor_id: 1,
    sensor_name: "Test sensor",
    sensor_description: "Test sensor",
    latitude: -37.813,
    longitude: 144.9664,
    total_of_directions: 40,
    sensing_datetime: "2026-08-11T10:00:00Z",
    density_level: "Low",
    source: "Test data",
    ...overrides
  };
}

test("returns Unknown without using unrelated sensors", () => {
  const farAwaySensor = sensor({ latitude: -37.75, longitude: 145.1, total_of_directions: 90 });
  const result = rateRoute(route, [farAwaySensor]);

  assert.equal(result.sensory_level, "Unknown");
  assert.equal(result.nearby_sensor_count, 0);
  assert.equal(result.average_pedestrian_count, null);
  assert.equal(result.highest_pedestrian_count, null);
  assert.deepEqual(result.nearby_sensors, []);
  assert.match(result.explanation, /No unrelated sensors were used/);
});

test("rates a route from sensors within 180 metres", () => {
  const result = rateRoute(route, [sensor({ total_of_directions: 60 })]);

  assert.equal(result.sensory_level, "High");
  assert.equal(result.nearby_sensor_count, 1);
  assert.equal(result.average_pedestrian_count, 60);
  assert.equal(result.highest_pedestrian_count, 60);
  assert.equal(result.congestion.threshold_people_per_minute, 50);
  assert.equal(result.congestion.congested_segment_count, 1);
  assert.equal(result.congestion.exposure_score, 60);
  assert.equal(result.congestion.congested_areas[0].sensor_description, "Test sensor");
});

test("does not mark low-activity route sensors as congested", () => {
  const result = rateRoute(route, [sensor({ total_of_directions: 49 })]);

  assert.equal(result.congestion.congested_segment_count, 0);
  assert.equal(result.congestion.exposure_score, 0);
});

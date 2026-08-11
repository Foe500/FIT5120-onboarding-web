import { distanceToPolyline } from "./geo.js";

const NEAR_ROUTE_THRESHOLD_METRES = 180;

function levelFromAverage(average) {
  return average >= 50 ? "High" : "Low";
}

export function rateRoute(route, sensors) {
  const nearbySensors = sensors
    .map((sensor) => ({
      ...sensor,
      distance_to_route_meters: Math.round(distanceToPolyline([sensor.latitude, sensor.longitude], route.coordinates))
    }))
    .filter((sensor) => sensor.distance_to_route_meters <= NEAR_ROUTE_THRESHOLD_METRES)
    .sort((a, b) => b.total_of_directions - a.total_of_directions);

  const countedSensors = nearbySensors.length > 0 ? nearbySensors : sensors.slice(0, 3);
  const average =
    countedSensors.length === 0
      ? 0
      : countedSensors.reduce((sum, sensor) => sum + Number(sensor.total_of_directions || 0), 0) / countedSensors.length;
  const highest =
    countedSensors.length === 0
      ? 0
      : Math.max(...countedSensors.map((sensor) => Number(sensor.total_of_directions || 0)));
  const sensoryLevel = levelFromAverage(average);

  const topSensorNames = countedSensors
    .slice(0, 3)
    .map((sensor) => `${sensor.sensor_description} (${sensor.total_of_directions}/min)`)
    .join(", ");

  return {
    id: route.id,
    route_id: route.id,
    route_name: route.name,
    route_mode: route.mode,
    summary: route.summary,
    coordinates: route.coordinates,
    estimated_walking_time: route.estimated_walking_time,
    walking_time_minutes: route.walking_time_minutes,
    distance_meters: route.distance_meters,
    sensory_level: sensoryLevel,
    average_pedestrian_count: Math.round(average),
    highest_pedestrian_count: Math.round(highest),
    nearby_sensor_count: countedSensors.length,
    nearby_sensors: countedSensors.slice(0, 8),
    explanation:
      sensoryLevel === "High"
        ? `This route is rated High because ${countedSensors.length} nearby pedestrian sensor(s) show an average of ${Math.round(
            average
          )} people per minute. The highest nearby sensor count is ${Math.round(
            highest
          )}. Highest contributing sensors: ${topSensorNames || "none available"}. Data comes from City of Melbourne Open Data.`
        : `This route is rated Low because ${countedSensors.length} nearby pedestrian sensor(s) show an average of ${Math.round(
            average
          )} people per minute, below the agreed threshold of 50. The highest nearby sensor count is ${Math.round(
            highest
          )}. Highest contributing sensors: ${topSensorNames || "none available"}. Data comes from City of Melbourne Open Data.`
  };
}

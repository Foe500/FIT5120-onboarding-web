import cors from "cors";
import express from "express";
import { destinationPresets, startPresets } from "./data/places.js";
import { fetchLiveSensors } from "./services/openData.js";
import { rateRoute } from "./services/rating.js";
import { resolveRouteRequest } from "./services/routes.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function readStartCoordinates(query) {
  const hasLatitude = query.startLat !== undefined;
  const hasLongitude = query.startLng !== undefined;

  if (!hasLatitude && !hasLongitude) return null;
  if (!hasLatitude || !hasLongitude) {
    throw new TypeError("Both startLat and startLng are required.");
  }

  const latitude = Number(query.startLat);
  const longitude = Number(query.startLng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError("Start coordinates must be valid numbers.");
  }

  return [latitude, longitude];
}

function resolveRequestFromQuery(query) {
  return resolveRouteRequest(query.start, query.destination, readStartCoordinates(query));
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "Hush sensory navigation API",
    open_data: "City of Melbourne Explore API v2.1"
  });
});

app.get("/api/places", (_request, response) => {
  response.json({
    starts: startPresets,
    destinations: destinationPresets
  });
});

app.get("/api/sensors/live", async (request, response) => {
  const limit = request.query.limit ?? 100;
  const data = await fetchLiveSensors(limit);
  response.json(data);
});

app.get("/api/routes", (request, response) => {
  try {
    response.json(resolveRequestFromQuery(request.query));
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Invalid route request." });
  }
});

app.get("/api/routes/sensory-rating", async (request, response) => {
  let routeResult;
  try {
    routeResult = resolveRequestFromQuery(request.query);
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Invalid route request." });
    return;
  }

  const sensorResult = await fetchLiveSensors(request.query.limit ?? 100);
  const ratedRoutes = routeResult.routes.map((route) => rateRoute(route, sensorResult.sensors));

  response.json({
    ...routeResult,
    routes: ratedRoutes,
    sensors: sensorResult.sensors,
    data_status: sensorResult.data_status,
    rating_rule: {
      low: "average pedestrian count < 50",
      high: "average pedestrian count >= 50",
      source_fields: ["location_id", "sensor_id", "total_of_directions", "latitude", "longitude"]
    }
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: "API route not found" });
});

app.listen(port, () => {
  console.log(`Hush API running on http://localhost:${port}`);
});

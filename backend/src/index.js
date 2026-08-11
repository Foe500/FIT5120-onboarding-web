import cors from "cors";
import express from "express";
import { destinationPresets, startPresets } from "./data/places.js";
import { searchPlaces } from "./services/geocoding.js";
import { fetchLiveSensors } from "./services/openData.js";
import { rateRoute } from "./services/rating.js";
import { resolveRouteRequest } from "./services/routes.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function readCoordinates(query, latitudeKey, longitudeKey, label) {
  const hasLatitude = query[latitudeKey] !== undefined;
  const hasLongitude = query[longitudeKey] !== undefined;

  if (!hasLatitude && !hasLongitude) return null;
  if (!hasLatitude || !hasLongitude) {
    throw new TypeError(`Both ${latitudeKey} and ${longitudeKey} are required.`);
  }

  const latitude = Number(query[latitudeKey]);
  const longitude = Number(query[longitudeKey]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError(`${label} coordinates must be valid numbers.`);
  }

  return [latitude, longitude];
}

async function resolveRequestFromQuery(query) {
  return resolveRouteRequest(
    query.start,
    query.destination,
    readCoordinates(query, "startLat", "startLng", "Start"),
    readCoordinates(query, "destinationLat", "destinationLng", "Destination")
  );
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

app.get("/api/geocode", async (request, response) => {
  try {
    const results = await searchPlaces(request.query.q);
    response.json({ results });
  } catch (error) {
    const isInputError = error instanceof TypeError;
    response.status(isInputError ? 400 : 502).json({
      error: error instanceof Error ? error.message : "Places could not be searched."
    });
  }
});

app.get("/api/sensors/live", async (request, response) => {
  const limit = request.query.limit ?? 100;
  const data = await fetchLiveSensors(limit);
  response.json(data);
});

app.get("/api/routes", async (request, response) => {
  try {
    response.json(await resolveRequestFromQuery(request.query));
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Invalid route request." });
  }
});

app.get("/api/routes/sensory-rating", async (request, response) => {
  let routeResult;
  try {
    routeResult = await resolveRequestFromQuery(request.query);
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
      unknown: "no pedestrian sensors within 180 metres of the route",
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

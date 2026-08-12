import cors from "cors";
import express from "express";
import { destinationPresets, startPresets } from "./data/places.js";
import { searchPlaces } from "./services/geocoding.js";
import { fetchLiveSensors } from "./services/openData.js";
import { CONGESTION_THRESHOLD, rateRoute } from "./services/rating.js";
import { resolveRouteRequest } from "./services/routes.js";
import { getValidatedRefuges } from "./services/refuges.js";

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("This frontend origin is not allowed by CORS."));
  }
}));
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

app.get("/api/refuges", (_request, response) => {
  response.json({
    refuges: getValidatedRefuges(),
    categories: ["Park", "Library", "Quiet public space"]
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
  const proposedRoute = ratedRoutes[0];
  const proposedExposure = proposedRoute?.congestion.exposure_score ?? 0;
  const lowerCongestionAlternatives = proposedRoute && proposedRoute.congestion.congested_segment_count > 0
    ? ratedRoutes.slice(1).filter((route) =>
      route.sensory_level !== "Unknown" && route.congestion.exposure_score < proposedExposure
    )
    : [];
  const recommendedRoute = lowerCongestionAlternatives
    .sort((a, b) => a.congestion.exposure_score - b.congestion.exposure_score || a.walking_time_minutes - b.walking_time_minutes)[0];
  const congestionGuidance = !proposedRoute || proposedRoute.congestion.congested_segment_count === 0
    ? {
        status: "no_congestion_on_proposed_route",
        recommended_route_id: null,
        message: "The proposed route has no identified highly congested pedestrian corridors in the available data."
      }
    : recommendedRoute
      ? {
          status: "lower_congestion_route_available",
          recommended_route_id: recommendedRoute.id,
          message: `${recommendedRoute.route_name} avoids more of the identified congested corridors than the proposed route and remains connected to your destination.`
        }
      : {
          status: "no_lower_congestion_route_available",
          recommended_route_id: null,
          message: "Highly congested corridors were identified on the proposed route, but no suitable connected lower-congestion alternative is available from the current route options."
        };

  response.json({
    ...routeResult,
    routes: ratedRoutes.map((route) => ({ ...route, is_low_congestion_recommendation: route.id === congestionGuidance.recommended_route_id })),
    sensors: sensorResult.sensors,
    data_status: sensorResult.data_status,
    congestion_guidance: congestionGuidance,
    rating_rule: {
      low: `average pedestrian count < ${CONGESTION_THRESHOLD}`,
      high: `average pedestrian count >= ${CONGESTION_THRESHOLD}`,
      unknown: "no pedestrian sensors within 180 metres of the route",
      source_fields: ["location_id", "sensor_id", "total_of_directions", "latitude", "longitude"]
    }
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: "API route not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Hush API running on http://localhost:${port}`);
});

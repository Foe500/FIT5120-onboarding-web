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
  const result = resolveRouteRequest(request.query.start, request.query.destination);
  response.json(result);
});

app.get("/api/routes/sensory-rating", async (request, response) => {
  const routeResult = resolveRouteRequest(request.query.start, request.query.destination);
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

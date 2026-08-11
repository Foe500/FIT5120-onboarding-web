const ROUTING_BASE_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";
const REQUEST_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const routeCache = new Map();

let requestQueue = Promise.resolve();
let nextRequestAt = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function scheduleRequest(task) {
  const scheduled = requestQueue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay > 0) await wait(delay);
    nextRequestAt = Date.now() + REQUEST_INTERVAL_MS;
    return task();
  });

  requestQueue = scheduled.catch(() => undefined);
  return scheduled;
}

function coordinateKey(coordinates) {
  return coordinates.map(([latitude, longitude]) => `${latitude.toFixed(6)},${longitude.toFixed(6)}`).join(";");
}

function toOsrmCoordinates(coordinates) {
  return coordinates.map(([latitude, longitude]) => `${longitude},${latitude}`).join(";");
}

async function requestOsrmRoute(coordinates, alternatives) {
  return scheduleRequest(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const query = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      alternatives: String(alternatives),
      steps: "false"
    });

    try {
      const response = await fetch(`${ROUTING_BASE_URL}/${toOsrmCoordinates(coordinates)}?${query}`, {
        headers: { "User-Agent": "FIT5120-Sensory-Routes-Prototype/1.0" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Walking route service returned ${response.status}.`);

      const payload = await response.json();
      if (payload.code !== "Ok" || !Array.isArray(payload.routes) || payload.routes.length === 0) {
        throw new Error(payload.message || "Walking route service returned no route.");
      }
      return payload.routes;
    } finally {
      clearTimeout(timeout);
    }
  });
}

function alternativeWaypoint(start, destination) {
  const midpointLatitude = (start[0] + destination[0]) / 2;
  const midpointLongitude = (start[1] + destination[1]) / 2;
  return [
    Math.max(-37.823, Math.min(-37.802, midpointLatitude)),
    Math.max(144.949, Math.min(144.971, midpointLongitude - 0.0024))
  ];
}

function toRoute(route, index, mode = index === 0 ? "Direct" : "Alternative") {
  const minutes = Math.max(1, Math.round(Number(route.duration) / 60));
  return {
    id: `live-walking-${index + 1}-${Math.round(route.distance)}`,
    name: index === 0 ? "Live walking route" : "Live CBD alternative",
    mode,
    summary: index === 0
      ? "Real pedestrian route following OpenStreetMap streets and paths."
      : "Real pedestrian alternative routed through a different CBD approach.",
    estimated_walking_time: `${minutes} min`,
    walking_time_minutes: minutes,
    distance_meters: Math.round(Number(route.distance)),
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude])
  };
}

export async function fetchWalkingRoutes(start, destination) {
  const key = coordinateKey([start.coordinates, destination.coordinates]);
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.routes;

  const directResults = await requestOsrmRoute([start.coordinates, destination.coordinates], 2);
  const routes = directResults.slice(0, 2).map((route, index) => toRoute(route, index));

  if (routes.length < 2) {
    const via = alternativeWaypoint(start.coordinates, destination.coordinates);
    const [alternative] = await requestOsrmRoute([start.coordinates, via, destination.coordinates], false);
    routes.push(toRoute(alternative, 1));
  }

  routeCache.set(key, { createdAt: Date.now(), routes });
  return routes;
}

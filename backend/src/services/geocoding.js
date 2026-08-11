import { cbdBounds } from "../data/places.js";

const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const resultCache = new Map();

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

function normaliseQuery(query) {
  const value = String(query || "").trim().replace(/\s+/g, " ");
  if (value.length < 2) throw new TypeError("Enter at least two characters to search for a place.");
  if (value.length > 120) throw new TypeError("Place searches must be 120 characters or fewer.");
  return value;
}

function toPlace(result) {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const name = String(result.name || result.display_name?.split(",")[0] || "Selected place");

  return {
    id: `osm-${result.osm_type || "place"}-${result.osm_id || `${latitude}-${longitude}`}`,
    name,
    address: String(result.display_name || name),
    coordinates: [latitude, longitude]
  };
}

export async function searchPlaces(query) {
  const value = normaliseQuery(query);
  const cacheKey = value.toLowerCase();
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.results;

  return scheduleRequest(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const params = new URLSearchParams({
      q: value,
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
      countrycodes: "au",
      bounded: "1",
      viewbox: `${cbdBounds.west},${cbdBounds.north},${cbdBounds.east},${cbdBounds.south}`,
      "accept-language": "en"
    });

    try {
      const response = await fetch(`${GEOCODING_URL}?${params}`, {
        headers: {
          "User-Agent": "FIT5120-Sensory-Routes-Prototype/1.0 (https://github.com/Foe500/FIT5120-onboarding-web)"
        },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Place search service returned ${response.status}.`);

      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("Place search service returned an invalid response.");

      const results = payload
        .map(toPlace)
        .filter((place) => place.coordinates.every(Number.isFinite));
      resultCache.set(cacheKey, { createdAt: Date.now(), results });
      return results;
    } finally {
      clearTimeout(timeout);
    }
  });
}

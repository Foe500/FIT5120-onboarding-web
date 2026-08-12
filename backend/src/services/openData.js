import { fallbackSensors } from "../data/fallbackSensors.js";

const API_BASE = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets";
const COUNTS_DATASET = "pedestrian-counting-system-past-hour-counts-per-minute";
const LOCATIONS_DATASET = "pedestrian-counting-system-sensor-locations";
const REQUEST_TIMEOUT_MS = 9000;
const LIVE_DATA_MAX_AGE_MS = 15 * 60 * 1000;

function densityLevel(total) {
  return Number(total) >= 50 ? "High" : "Low";
}

function normaliseId(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function readCoordinates(record) {
  const geo = record.location || record.geolocation || record.coordinates;
  if (geo?.lat !== undefined && geo?.lon !== undefined) return [Number(geo.lat), Number(geo.lon)];
  if (geo?.latitude !== undefined && geo?.longitude !== undefined) return [Number(geo.latitude), Number(geo.longitude)];
  if (Array.isArray(geo) && geo.length >= 2) return [Number(geo[0]), Number(geo[1])];

  const lat = record.latitude ?? record.lat;
  const lon = record.longitude ?? record.lon ?? record.lng;
  if (lat !== undefined && lon !== undefined) return [Number(lat), Number(lon)];
  return null;
}

async function fetchDataset(dataset, params = {}) {
  const url = new URL(`${API_BASE}/${dataset}/records`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Open Data request failed: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normaliseSensor(sensor) {
  return {
    ...sensor,
    density_level: densityLevel(sensor.total_of_directions)
  };
}

function timestampFrom(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildDataStatus(sensors) {
  const observedTimestamps = sensors
    .map((sensor) => timestampFrom(sensor.sensing_datetime))
    .filter((timestamp) => timestamp !== null);
  const latestTimestamp = observedTimestamps.length ? Math.max(...observedTimestamps) : null;
  const isLive = latestTimestamp !== null && Date.now() - latestTimestamp <= LIVE_DATA_MAX_AGE_MS;
  const observedAt = latestTimestamp === null ? null : new Date(latestTimestamp).toISOString();

  return {
    source: "City of Melbourne Open Data",
    is_fallback: false,
    is_live: isLive,
    observed_at: observedAt,
    message: isLive
      ? "Live pedestrian count and sensor location data loaded from City of Melbourne Open Data."
      : "The latest available City of Melbourne pedestrian counts are not live. Historical/recent data is being used for this route."
  };
}

export async function fetchLiveSensors(limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 100));

  try {
    const [counts, locations] = await Promise.all([
      fetchDataset(COUNTS_DATASET, { limit: String(safeLimit), order_by: "sensing_datetime desc" }),
      fetchDataset(LOCATIONS_DATASET, { limit: String(safeLimit) })
    ]);

    const latestBySensor = new Map();
    for (const row of counts.results ?? []) {
      const id = normaliseId(row.sensor_id ?? row.location_id);
      if (!id || latestBySensor.has(id)) continue;
      latestBySensor.set(id, {
        location_id: Number(row.location_id ?? row.sensor_id),
        sensor_id: Number(row.sensor_id ?? row.location_id),
        total_of_directions: Number(row.total_of_directions ?? row.total_of_direction ?? 0),
        sensing_datetime: row.sensing_datetime ?? `${row.sensing_date ?? ""} ${row.sensing_time ?? ""}`.trim()
      });
    }

    const locationBySensor = new Map();
    for (const row of locations.results ?? []) {
      const id = normaliseId(row.sensor_id ?? row.location_id);
      const coordinates = readCoordinates(row);
      if (!id || !coordinates || coordinates.some(Number.isNaN)) continue;
      locationBySensor.set(id, {
        location_id: Number(row.location_id ?? row.sensor_id),
        sensor_id: Number(row.sensor_id ?? row.location_id),
        sensor_name: row.sensor_name ?? `Sensor ${id}`,
        sensor_description: row.sensor_description ?? row.name ?? `Sensor ${id}`,
        latitude: coordinates[0],
        longitude: coordinates[1],
        status: row.status,
        source: "City of Melbourne Open Data"
      });
    }

    const sensors = [];
    for (const [id, count] of latestBySensor.entries()) {
      const location = locationBySensor.get(id);
      if (!location) continue;
      sensors.push(normaliseSensor({ ...location, ...count }));
    }

    if (sensors.length === 0) throw new Error("No matching sensor records returned by live datasets.");
    return {
      sensors,
      data_status: buildDataStatus(sensors)
    };
  } catch (error) {
    return {
      sensors: fallbackSensors.map(normaliseSensor),
      data_status: {
        source: "Historical fallback data",
        is_fallback: true,
        is_live: false,
        observed_at: null,
        message: `Live pedestrian data are unavailable, so historical fallback estimates are being used. This information is not live. ${error.message}`
      }
    };
  }
}

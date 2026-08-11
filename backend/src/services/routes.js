import { destinationPresets, findPlace, isWithinCbd, startPresets } from "../data/places.js";
import { getPresetRoutes } from "../data/routes.js";
import { fetchWalkingRoutes } from "./walkingRoutes.js";

export async function resolveRouteRequest(startQuery, destinationQuery, startCoordinates = null) {
  let start = findPlace(startQuery, startPresets, startPresets[0]);
  const destination = findPlace(destinationQuery, destinationPresets, destinationPresets[0]);

  if (startCoordinates) {
    if (!isWithinCbd(startCoordinates)) {
      throw new RangeError("Current location must be within Melbourne CBD.");
    }

    start = {
      id: "current-location",
      name: "Current location",
      address: "Browser-provided location within Melbourne CBD",
      coordinates: startCoordinates
    };
  }

  try {
    const routes = await fetchWalkingRoutes(start, destination);
    return {
      start,
      destination,
      routes,
      routing_status: {
        provider: "FOSSGIS OSRM foot routing",
        is_live_routing: true,
        message: "Live walking geometry from the FOSSGIS routing service using OpenStreetMap data."
      }
    };
  } catch (error) {
    return {
      start,
      destination,
      routes: getPresetRoutes(start, destination),
      routing_status: {
        provider: "Preset Melbourne CBD routes",
        is_live_routing: false,
        message: `Live walking routing was unavailable, so preset routes were used. ${error instanceof Error ? error.message : ""}`.trim()
      }
    };
  }
}

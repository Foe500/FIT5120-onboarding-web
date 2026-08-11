import { destinationPresets, findPlace, isWithinCbd, startPresets } from "../data/places.js";
import { getPresetRoutes } from "../data/routes.js";
import { fetchWalkingRoutes } from "./walkingRoutes.js";

export async function resolveRouteRequest(startQuery, destinationQuery, startCoordinates = null, destinationCoordinates = null) {
  let start = findPlace(startQuery, startPresets, startPresets[0]);
  let destination = findPlace(destinationQuery, destinationPresets, destinationPresets[0]);

  if (startCoordinates) {
    if (!isWithinCbd(startCoordinates)) {
      throw new RangeError("The starting point must be within Melbourne CBD.");
    }

    const isCurrentLocation = String(startQuery || "").trim().toLowerCase() === "current location";
    start = {
      id: isCurrentLocation ? "current-location" : `searched-start-${startCoordinates.join("-")}`,
      name: isCurrentLocation ? "Current location" : String(startQuery || "Selected starting point").trim(),
      address: isCurrentLocation
        ? "Browser-provided location within Melbourne CBD"
        : "Place selected from OpenStreetMap search",
      coordinates: startCoordinates
    };
  }

  if (destinationCoordinates) {
    if (!isWithinCbd(destinationCoordinates)) {
      throw new RangeError("The selected destination must be within Melbourne CBD.");
    }

    destination = {
      id: `searched-destination-${destinationCoordinates.join("-")}`,
      name: String(destinationQuery || "Selected destination").trim(),
      address: "Place selected from OpenStreetMap search",
      coordinates: destinationCoordinates
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

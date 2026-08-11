import { destinationPresets, findPlace, startPresets } from "../data/places.js";
import { getPresetRoutes } from "../data/routes.js";

export function resolveRouteRequest(startQuery, destinationQuery) {
  const start = findPlace(startQuery, startPresets, startPresets[0]);
  const destination = findPlace(destinationQuery, destinationPresets, destinationPresets[0]);

  return {
    start,
    destination,
    routes: getPresetRoutes(start, destination),
    routing_status: {
      provider: "Preset Melbourne CBD routes",
      is_live_routing: false,
      message:
        "This onboarding prototype uses preset CBD walking route coordinates. The route service layer can be replaced with Google Maps, Mapbox, or OpenRouteService later."
    }
  };
}

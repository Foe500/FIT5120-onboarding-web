import type { Coordinates, GeocodeResponse, PlacesResponse, RatingResponse, RefugesResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getPlaces() {
  return request<PlacesResponse>("/api/places");
}

export function getRefuges() {
  return request<RefugesResponse>("/api/refuges");
}

export function searchPlaces(query: string) {
  const params = new URLSearchParams({ q: query });
  return request<GeocodeResponse>(`/api/geocode?${params.toString()}`);
}

export function getRatedRoutes(
  start: string,
  destination: string,
  startCoordinates?: Coordinates | null,
  destinationCoordinates?: Coordinates | null
) {
  const query = new URLSearchParams({ start, destination });
  if (startCoordinates) {
    query.set("startLat", String(startCoordinates[0]));
    query.set("startLng", String(startCoordinates[1]));
  }
  if (destinationCoordinates) {
    query.set("destinationLat", String(destinationCoordinates[0]));
    query.set("destinationLng", String(destinationCoordinates[1]));
  }
  return request<RatingResponse>(`/api/routes/sensory-rating?${query.toString()}`);
}

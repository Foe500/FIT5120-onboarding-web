import type { Coordinates, PlacesResponse, RatingResponse } from "./types";

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

export function getRatedRoutes(start: string, destination: string, startCoordinates?: Coordinates | null) {
  const query = new URLSearchParams({ start, destination });
  if (startCoordinates) {
    query.set("startLat", String(startCoordinates[0]));
    query.set("startLng", String(startCoordinates[1]));
  }
  return request<RatingResponse>(`/api/routes/sensory-rating?${query.toString()}`);
}

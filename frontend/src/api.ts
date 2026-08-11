import type { PlacesResponse, RatingResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export function getPlaces() {
  return request<PlacesResponse>("/api/places");
}

export function getRatedRoutes(start: string, destination: string) {
  const query = new URLSearchParams({ start, destination });
  return request<RatingResponse>(`/api/routes/sensory-rating?${query.toString()}`);
}

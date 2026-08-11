export type Coordinates = [number, number];

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface Sensor {
  location_id: number;
  sensor_id: number;
  sensor_name: string;
  sensor_description: string;
  latitude: number;
  longitude: number;
  total_of_directions: number;
  sensing_datetime: string;
  density_level: "Low" | "High";
  distance_to_route_meters?: number;
  source: string;
}

export interface RatedRoute {
  id: string;
  route_id: string;
  route_name: string;
  route_mode: string;
  summary: string;
  coordinates: Coordinates[];
  estimated_walking_time: string;
  walking_time_minutes: number;
  distance_meters: number;
  sensory_level: "Low" | "High" | "Unknown";
  average_pedestrian_count: number | null;
  highest_pedestrian_count: number | null;
  nearby_sensor_count: number;
  nearby_sensors: Sensor[];
  explanation: string;
}

export interface PlacesResponse {
  starts: Place[];
  destinations: Place[];
}

export interface GeocodeResponse {
  results: Place[];
}

export interface DataStatus {
  source: string;
  is_fallback: boolean;
  message: string;
}

export interface RatingResponse {
  start: Place;
  destination: Place;
  routes: RatedRoute[];
  sensors: Sensor[];
  data_status: DataStatus;
  routing_status: {
    provider: string;
    is_live_routing: boolean;
    message: string;
  };
  rating_rule: {
    low: string;
    high: string;
    unknown: string;
    source_fields: string[];
  };
}

export type Coordinates = [number, number];

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export type RefugeCategory = "Park" | "Library" | "Quiet public space";

export interface RefugeLocation extends Place {
  category: RefugeCategory;
  opening_information: string;
  source: string;
}

export interface RefugesResponse {
  refuges: RefugeLocation[];
  categories: RefugeCategory[];
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
  route_position?: Coordinates;
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
  congestion: {
    threshold_people_per_minute: number;
    congested_segment_count: number;
    exposure_score: number;
    congested_areas: CongestedArea[];
  };
  is_low_congestion_recommendation: boolean;
  explanation: string;
}

export interface CongestedArea {
  location_id: number;
  sensor_description: string;
  latitude: number;
  longitude: number;
  route_position: Coordinates;
  pedestrian_count: number;
  distance_to_route_meters: number;
  sensing_datetime: string;
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
  is_live: boolean;
  observed_at: string | null;
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
  congestion_guidance: {
    status: "no_congestion_on_proposed_route" | "lower_congestion_route_available" | "no_lower_congestion_route_available";
    recommended_route_id: string | null;
    message: string;
  };
  rating_rule: {
    low: string;
    high: string;
    unknown: string;
    source_fields: string[];
  };
}

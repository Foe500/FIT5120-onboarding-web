import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleHelp, Gauge, Info, MapPin, Timer } from "lucide-react";
import type { RatedRoute } from "../types";

interface RouteCardProps {
  route: RatedRoute;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export default function RouteCard({ route, selected, expanded, onSelect, onToggle }: RouteCardProps) {
  const isHigh = route.sensory_level === "High";
  const isUnknown = route.sensory_level === "Unknown";
  const StatusIcon = isUnknown ? CircleHelp : isHigh ? AlertTriangle : CheckCircle2;
  const levelClass = isUnknown ? "level-unknown" : isHigh ? "level-high" : "level-low";

  return (
    <article className={`route-card ${selected ? "route-card-selected" : ""}`}>
      <button
        type="button"
        className="route-select"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${route.route_name}, ${route.sensory_level} sensory load`}
      >
        <span className="route-heading">
          <span>
            <span className="route-mode">{route.route_mode}</span>
            <strong>{route.route_name}</strong>
          </span>
          <span className={`level-badge ${levelClass}`}>
            <StatusIcon size={16} aria-hidden="true" />
            {route.sensory_level} sensory load
          </span>
        </span>

        <span className="route-summary">{route.summary}</span>

        <span className="route-stats">
          <span>
            <Timer size={15} aria-hidden="true" />
            {route.estimated_walking_time}
          </span>
          <span>
            <MapPin size={15} aria-hidden="true" />
            {route.distance_meters} m
          </span>
          <span>
            <Gauge size={15} aria-hidden="true" />
            {route.average_pedestrian_count === null ? "No nearby data" : `Avg ${route.average_pedestrian_count}/min`}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="explain-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Hide" : "Show"} explanation for ${route.route_name}`}
      >
        <Info size={16} aria-hidden="true" />
        Why this rating?
        {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="explanation-panel">
          <p>{route.explanation}</p>
          <dl className="evidence-grid">
            <div>
              <dt>Nearby sensors</dt>
              <dd>{route.nearby_sensor_count}</dd>
            </div>
            <div>
              <dt>Average count</dt>
              <dd>{route.average_pedestrian_count === null ? "Not available" : `${route.average_pedestrian_count}/min`}</dd>
            </div>
            <div>
              <dt>Highest count</dt>
              <dd>{route.highest_pedestrian_count === null ? "Not available" : `${route.highest_pedestrian_count}/min`}</dd>
            </div>
          </dl>
          {route.nearby_sensors.length > 0 && (
            <div className="sensor-list" aria-label="Top nearby sensors used in route rating">
              {route.nearby_sensors.slice(0, 3).map((sensor) => (
                <span key={`${route.id}-${sensor.location_id}`}>
                  {sensor.sensor_description}: {sensor.total_of_directions}/min
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

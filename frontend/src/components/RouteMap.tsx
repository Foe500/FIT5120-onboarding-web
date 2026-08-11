import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { labelIcon, sensorIcon } from "../mapIcons";
import type { Place, RatedRoute } from "../types";

interface RouteMapProps {
  start?: Place;
  destination?: Place;
  routes: RatedRoute[];
  selectedRouteId?: string;
  onRouteSelect: (routeId: string) => void;
}

const routePalette = ["#147a62", "#193d5a", "#b55431"];

export default function RouteMap({
  start,
  destination,
  routes,
  selectedRouteId,
  onRouteSelect
}: RouteMapProps) {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const visibleSensors = selectedRoute?.nearby_sensors ?? [];

  return (
    <MapContainer
      center={destination?.coordinates ?? [-37.8136, 144.9631]}
      zoom={15}
      scrollWheelZoom
      className="map-canvas"
      aria-label="Interactive map showing routes and pedestrian sensors"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routes.map((route, index) => {
        const selected = route.id === selectedRoute?.id;
        return (
          <Polyline
            key={route.id}
            positions={route.coordinates}
            pathOptions={{
              color: selected ? routePalette[index % routePalette.length] : "#8a98a9",
              weight: selected ? 7 : 4,
              opacity: selected ? 0.95 : 0.46
            }}
            eventHandlers={{ click: () => onRouteSelect(route.id) }}
          />
        );
      })}

      {selectedRoute?.coordinates.map((point, index) => (
        <CircleMarker
          key={`${selectedRoute.id}-point-${index}`}
          center={point}
          radius={4}
          pathOptions={{ color: "#172033", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
        />
      ))}

      {start && (
        <Marker position={start.coordinates} icon={labelIcon("Start", "place-marker start-marker")}>
          <Popup>
            <strong>Starting point</strong>
            <br />
            {start.name}
            <br />
            {start.address}
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination.coordinates} icon={labelIcon("Destination", "place-marker destination-marker")}>
          <Popup>
            <strong>Destination</strong>
            <br />
            {destination.name}
            <br />
            {destination.address}
          </Popup>
        </Marker>
      )}

      {visibleSensors.map((sensor) => (
        <Marker
          key={`${sensor.location_id}-${sensor.sensing_datetime}`}
          position={[sensor.latitude, sensor.longitude]}
          icon={sensorIcon(sensor.density_level)}
        >
          <Popup>
            <strong>{sensor.sensor_description}</strong>
            <br />
            Sensor ID: {sensor.sensor_id}
            <br />
            Count: {sensor.total_of_directions} people/min
            <br />
            Density: {sensor.density_level}
            <br />
            Source: {sensor.source}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

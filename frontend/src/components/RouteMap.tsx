import { Fragment } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { congestionIcon, labelIcon, sensorIcon } from "../mapIcons";
import type { Place, RatedRoute, RefugeLocation } from "../types";

interface RouteMapProps {
  start?: Place;
  destination?: Place;
  routes: RatedRoute[];
  selectedRouteId?: string;
  refuges: RefugeLocation[];
  showRefuges: boolean;
  onNavigateRefuge: (refuge: RefugeLocation) => void;
  onRouteSelect: (routeId: string) => void;
}

function approximateDistanceMetres([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(value)) / 10) * 10;
}

const routePalette = ["#147a62", "#193d5a", "#b55431"];

export default function RouteMap({
  start,
  destination,
  routes,
  selectedRouteId,
  refuges,
  showRefuges,
  onNavigateRefuge,
  onRouteSelect
}: RouteMapProps) {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const visibleSensors = (selectedRoute?.nearby_sensors ?? []).filter((sensor) => sensor.density_level === "Low");
  const congestedAreas = selectedRoute?.congestion.congested_areas ?? [];

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
          position={sensor.route_position ?? [sensor.latitude, sensor.longitude]}
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
            Displayed at the nearest point on the route ({sensor.distance_to_route_meters} m from sensor)
            <br />
            Source: {sensor.source}
          </Popup>
        </Marker>
      ))}

      {congestedAreas.map((area) => (
        <Fragment key={`congestion-${area.location_id}`}>
          <Circle
            center={area.route_position}
            radius={70}
            pathOptions={{ color: "#b55431", fillColor: "#d96b43", fillOpacity: 0.22, weight: 2, dashArray: "5 7" }}
          />
          <Marker
            position={area.route_position}
            icon={congestionIcon()}
          >
            <Popup>
              <strong>Highly congested pedestrian corridor</strong>
              <br />
              {area.sensor_description}
              <br />
              {area.pedestrian_count} people/min (threshold: {selectedRoute?.congestion.threshold_people_per_minute})
              <br />
              Estimated congestion area: 70 m radius
              <br />
              Sensor is {area.distance_to_route_meters} m from selected route; marker is aligned to the route
            </Popup>
          </Marker>
        </Fragment>
      ))}

      {showRefuges && refuges.map((refuge) => {
        const distance = start ? approximateDistanceMetres(start.coordinates, refuge.coordinates) : null;
        return (
          <CircleMarker
            key={refuge.id}
            center={refuge.coordinates}
            radius={10}
            pathOptions={{ color: "#ffffff", fillColor: "#315266", fillOpacity: 1, weight: 3 }}
          >
            <Popup>
              <strong>{refuge.name}</strong>
              <br />
              {refuge.category}
              <br />
              {distance === null ? "Distance unavailable" : `Approx. ${distance} m from your start`}
              <br />
              {refuge.opening_information}
              <br />
              <a href={refuge.source} target="_blank" rel="noreferrer">Location source</a>
              <br />
              <button type="button" className="refuge-navigate-button" onClick={() => onNavigateRefuge(refuge)}>Walk here</button>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Database,
  Footprints,
  LocateFixed,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Waves
} from "lucide-react";
import { getPlaces, getRatedRoutes } from "./api";
import RouteCard from "./components/RouteCard";
import RouteMap from "./components/RouteMap";
import type { Coordinates, Place, RatingResponse } from "./types";

const defaultStart = "Melbourne Town Hall";
const cbdBounds = { north: -37.8005, south: -37.8248, west: 144.946, east: 144.9735 };

function isWithinMelbourneCbd([latitude, longitude]: Coordinates) {
  return latitude <= cbdBounds.north && latitude >= cbdBounds.south && longitude >= cbdBounds.west && longitude <= cbdBounds.east;
}

export default function App() {
  const [starts, setStarts] = useState<Place[]>([]);
  const [destinations, setDestinations] = useState<Place[]>([]);
  const [startInput, setStartInput] = useState(defaultStart);
  const [destinationInput, setDestinationInput] = useState("");
  const [routeData, setRouteData] = useState<RatingResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    getPlaces()
      .then((payload) => {
        setStarts(payload.starts);
        setDestinations(payload.destinations);
      })
      .catch(() => setError("Preset CBD locations could not be loaded. You can still type a known destination."));
  }, []);

  const selectedRoute = useMemo(() => {
    if (!routeData?.routes.length) return undefined;
    return routeData.routes.find((route) => route.id === selectedRouteId) ?? routeData.routes[0];
  }, [routeData, selectedRouteId]);

  async function loadRoutes(start: string, destination: string, startCoordinates = currentCoordinates) {
    if (!destination.trim()) {
      setError("Enter a destination in Melbourne CBD to continue.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = await getRatedRoutes(start, destination, startCoordinates);
      setRouteData(payload);
      setSelectedRouteId(payload.routes[0]?.id ?? "");
      setExpandedRouteId(payload.routes[0]?.id ?? "");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Routes could not be loaded. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRoutes(startInput, destinationInput);
  }

  function useCurrentLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates: Coordinates = [coords.latitude, coords.longitude];
        if (!isWithinMelbourneCbd(coordinates)) {
          setCurrentCoordinates(null);
          setLocationError("Your current location is outside the Melbourne CBD prototype coverage area.");
          setLocating(false);
          return;
        }

        setCurrentCoordinates(coordinates);
        setStartInput("Current location");
        setLocating(false);
        if (routeData) void loadRoutes("Current location", destinationInput, coordinates);
      },
      (geolocationError) => {
        const message = geolocationError.code === geolocationError.PERMISSION_DENIED
          ? "Location permission was denied. Allow location access in your browser or enter a starting point."
          : geolocationError.code === geolocationError.TIMEOUT
            ? "Finding your location timed out. Try again or enter a starting point."
            : "Your current location could not be determined.";
        setCurrentCoordinates(null);
        setLocationError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function chooseDestination(destination: Place) {
    setDestinationInput(destination.name);
    if (routeData) void loadRoutes(startInput, destination.name);
  }

  function chooseStart(start: Place) {
    setCurrentCoordinates(null);
    setLocationError("");
    setStartInput(start.name);
    if (routeData) void loadRoutes(start.name, destinationInput, null);
  }

  function resetPlanner() {
    setRouteData(null);
    setDestinationInput("");
    setSelectedRouteId("");
    setExpandedRouteId("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={resetPlanner} aria-label="Return to journey planner">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">sensory<span>.</span>routes</span>
        </button>
        {routeData ? (
          <button type="button" className="new-journey-button" onClick={resetPlanner}>
            <ArrowLeft size={16} aria-hidden="true" />
            Plan another route
          </button>
        ) : (
          <span className="city-label"><MapPin size={14} aria-hidden="true" /> Melbourne CBD</span>
        )}
      </header>

      {!routeData ? (
        <main className="onboarding-page">
          <section className="onboarding-intro" aria-labelledby="welcome-heading">
            <div className="intro-copy">
              <p className="eyebrow">Sensory-aware route planning</p>
              <h1 id="welcome-heading">A calmer way<br />through Melbourne.</h1>
              <p>Choose where you are going, then compare walking routes using nearby pedestrian activity and clear sensory evidence.</p>
            </div>
            <dl className="city-signal" aria-label="Route planner coverage">
              <div><dt>City coverage</dt><dd>Melbourne CBD</dd></div>
              <div><dt>Data signal</dt><dd><span className="live-dot" /> Live open data</dd></div>
              <div><dt>Route language</dt><dd>Low / High load</dd></div>
            </dl>
          </section>

          <section className="journey-panel" aria-labelledby="journey-heading">
            <div className="journey-heading">
              <span className="step-number">01</span>
              <p className="eyebrow">Start your journey</p>
              <h2 id="journey-heading">Tell us where<br />you are headed.</h2>
              <p>The map stays out of the way until your journey is ready.</p>
            </div>
            <form className="journey-form" onSubmit={submitSearch}>
              <div className="field-group">
                <label htmlFor="start">Starting point</label>
                <span className="field-context">{currentCoordinates ? "Using your current position" : "Where the walk begins"}</span>
                <div className="search-field">
                  <MapPin size={19} aria-hidden="true" />
                  <input
                    id="start"
                    list="start-options"
                    value={startInput}
                    onChange={(event) => {
                      setStartInput(event.target.value);
                      setCurrentCoordinates(null);
                      setLocationError("");
                    }}
                    placeholder="Search starting point"
                  />
                  <button
                    type="button"
                    className="field-location-button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    aria-label={locating ? "Finding your current location" : "Use your current location"}
                    title="Use current location"
                  >
                    <LocateFixed size={18} aria-hidden="true" />
                  </button>
                </div>
                {currentCoordinates && <span className="field-message success" role="status">Current location ready</span>}
                {locationError && <span className="field-message error" role="alert">{locationError}</span>}
              </div>
              <datalist id="start-options">
                {starts.map((start) => <option key={start.id} value={start.name} />)}
              </datalist>

              <div className="field-group destination-group">
                <label htmlFor="destination">Destination</label>
                <span className="field-context">Where you want to arrive</span>
                <div className="search-field">
                  <Search size={19} aria-hidden="true" />
                  <input
                    id="destination"
                    list="destination-options"
                    value={destinationInput}
                    onChange={(event) => setDestinationInput(event.target.value)}
                    placeholder="Search destination"
                    autoComplete="off"
                  />
                </div>
                <div className="suggestion-row" aria-label="Popular destinations">
                  {destinations.slice(0, 3).map((destination) => (
                    <button type="button" key={destination.id} onClick={() => setDestinationInput(destination.name)}>
                      {destination.name}
                    </button>
                  ))}
                </div>
              </div>
              <datalist id="destination-options">
                {destinations.map((destination) => <option key={destination.id} value={destination.name} />)}
              </datalist>

              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="find-routes-button" type="submit" disabled={loading}>
                <span>{loading ? "Comparing routes..." : "Compare routes"}</span>
                <Route size={19} aria-hidden="true" />
              </button>
            </form>
          </section>
        </main>
      ) : (
        <main className="results-page">
          <section className="planner" id="planner" aria-label="Sensory route planner">
            <aside className="results-panel" aria-label="Route search and sensory route results">
              <div className="panel-intro">
                <div>
                  <p className="eyebrow">Walking routes</p>
                  <h2>{routeData.destination.name}</h2>
                </div>
                <button type="button" className="icon-button" aria-label="Refresh route sensory ratings" title="Refresh ratings" onClick={() => void loadRoutes(startInput, destinationInput)}>
                  <RefreshCw size={17} aria-hidden="true" />
                </button>
              </div>

              <div className="start-control">
                <label htmlFor="result-start">Starting point</label>
                <div className="input-action-row">
                  <input
                    id="result-start"
                    value={startInput}
                    onChange={(event) => {
                      setStartInput(event.target.value);
                      setCurrentCoordinates(null);
                      setLocationError("");
                    }}
                  />
                  <button type="button" className="location-button" onClick={useCurrentLocation} disabled={locating} title="Use current location">
                    <LocateFixed size={16} aria-hidden="true" /><span>{locating ? "Locating..." : "Use current"}</span>
                  </button>
                </div>
                {currentCoordinates && <span className="result-location-status">Current location ready</span>}
                {locationError && <span className="result-location-status error" role="alert">{locationError}</span>}
              </div>

              <div className="quick-section">
                <p>Popular destinations</p>
                <div className="chip-list" aria-label="Quick destination options">
                  {destinations.slice(0, 5).map((destination) => (
                    <button key={destination.id} type="button" className={routeData.destination.id === destination.id ? "chip active-chip" : "chip"} onClick={() => chooseDestination(destination)}>
                      {destination.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={routeData.data_status.is_fallback ? "data-status fallback" : "data-status live"} aria-label="Open data status">
                {routeData.data_status.is_fallback ? <AlertCircle size={18} aria-hidden="true" /> : <Database size={18} aria-hidden="true" />}
                <div><strong>{routeData.data_status.source}</strong><span>{routeData.data_status.message}</span></div>
              </div>

              {loading && <div className="loading-card">Calculating sensory load from pedestrian count data...</div>}
              {error && <div className="error-card">{error}</div>}

              <div className="route-list">
                {!loading && routeData.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    selected={selectedRoute?.id === route.id}
                    expanded={expandedRouteId === route.id}
                    onSelect={() => setSelectedRouteId(route.id)}
                    onToggle={() => setExpandedRouteId(expandedRouteId === route.id ? "" : route.id)}
                  />
                ))}
              </div>
              <div className="quick-starts">
                <span>Try another start:</span>
                {starts.slice(0, 3).map((start) => <button type="button" key={start.id} onClick={() => chooseStart(start)}>{start.name}</button>)}
              </div>
            </aside>

            <section className="map-panel" aria-label="Map and route evidence">
              <div className="map-toolbar">
                <div><p className="eyebrow">Selected route</p><h2>{selectedRoute?.route_name ?? "Loading route"}</h2></div>
                <div className="map-legend" aria-label="Map sensor legend">
                  <strong>Pedestrian sensors</strong>
                  <span><i className="legend-symbol low-symbol" /> Low activity</span>
                  <span><i className="legend-symbol high-symbol" /> High activity</span>
                </div>
              </div>
              <div className="map-frame">
                <RouteMap
                  start={routeData.start}
                  destination={routeData.destination}
                  routes={routeData.routes}
                  sensors={routeData.sensors}
                  selectedRouteId={selectedRoute?.id}
                  onRouteSelect={(routeId) => { setSelectedRouteId(routeId); setExpandedRouteId(routeId); }}
                />
              </div>
              <div className="map-footer"><span>Powered by City of Melbourne Open Data</span><span>{routeData.routing_status.provider}</span></div>
            </section>
          </section>

          <section className="how-section" id="how-it-works">
            <div className="how-heading"><p className="eyebrow">Transparent by design</p><h2>How sensory ratings work</h2><p>Simple evidence, visible reasoning, and no mystery score.</p></div>
            <div className="steps">
              <article><span>01</span><Route size={22} aria-hidden="true" /><h3>Map route segments</h3><p>We trace each walking option through Melbourne CBD street blocks.</p></article>
              <article><span>02</span><Activity size={22} aria-hidden="true" /><h3>Read pedestrian data</h3><p>Nearby City of Melbourne sensors reveal activity along the journey.</p></article>
              <article><span>03</span><Footprints size={22} aria-hidden="true" /><h3>Make it understandable</h3><p>Routes become clear Low or High sensory-load choices with supporting evidence.</p></article>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer"><span>sensory.routes · FIT5120 prototype</span><span>Designed for calmer urban journeys</span></footer>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Database,
  Footprints,
  LocateFixed,
  MapPin,
  RefreshCw,
  Route,
  Waves
} from "lucide-react";
import { getPlaces, getRatedRoutes } from "./api";
import RouteCard from "./components/RouteCard";
import RouteMap from "./components/RouteMap";
import type { Place, RatingResponse } from "./types";

const defaultStart = "Melbourne Town Hall";
const defaultDestination = "State Library Victoria";

export default function App() {
  const [starts, setStarts] = useState<Place[]>([]);
  const [destinations, setDestinations] = useState<Place[]>([]);
  const [startInput, setStartInput] = useState(defaultStart);
  const [destinationInput, setDestinationInput] = useState(defaultDestination);
  const [routeData, setRouteData] = useState<RatingResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [expandedRouteId, setExpandedRouteId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPlaces()
      .then((payload) => {
        setStarts(payload.starts);
        setDestinations(payload.destinations);
      })
      .catch(() => setError("Preset CBD locations could not be loaded. You can still type a known destination."));
  }, []);

  useEffect(() => {
    void loadRoutes(defaultStart, defaultDestination);
  }, []);

  const selectedRoute = useMemo(() => {
    if (!routeData?.routes.length) return undefined;
    return routeData.routes.find((route) => route.id === selectedRouteId) ?? routeData.routes[0];
  }, [routeData, selectedRouteId]);

  async function loadRoutes(start: string, destination: string) {
    setLoading(true);
    setError("");
    try {
      const payload = await getRatedRoutes(start, destination);
      setRouteData(payload);
      setSelectedRouteId(payload.routes[0]?.id ?? "");
      setExpandedRouteId(payload.routes[0]?.id ?? "");
    } catch {
      setError("Routes could not be loaded. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRoutes(startInput, destinationInput);
  }

  function useCurrentLocationDemo() {
    setStartInput("Melbourne Town Hall");
    void loadRoutes("Melbourne Town Hall", destinationInput);
  }

  function chooseDestination(destination: Place) {
    setDestinationInput(destination.name);
    void loadRoutes(startInput, destination.name);
  }

  function chooseStart(start: Place) {
    setStartInput(start.name);
    void loadRoutes(start.name, destinationInput);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="Sensory Routes home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">sensory<span>.</span>routes</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#planner">Route planner</a>
          <a href="#how-it-works">How ratings work</a>
        </nav>
        <span className="city-label"><MapPin size={14} aria-hidden="true" /> Melbourne CBD</span>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Building sensory-friendly urban futures</p>
            <h1>Choose a route<br />that feels right.</h1>
            <p className="hero-summary">
              Compare Melbourne CBD walking routes with clear sensory information, so you can move through the city with more confidence.
            </p>
          </div>
          <div className="hero-metrics" aria-label="Prototype capabilities">
            <span><Activity size={16} aria-hidden="true" /> Live pedestrian data</span>
            <span><Waves size={16} aria-hidden="true" /> Clear sensory ratings</span>
          </div>
          <form onSubmit={submitSearch} className="hero-search">
            <MapPin size={20} aria-hidden="true" />
            <label className="sr-only" htmlFor="destination">Destination in Melbourne CBD</label>
            <input
              id="destination"
              value={destinationInput}
              onChange={(event) => setDestinationInput(event.target.value)}
              placeholder="Enter a Melbourne CBD destination"
            />
            <button type="submit">
              Find routes
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
        </section>

        <section className="planner" id="planner" aria-label="Sensory route planner">
          <aside className="results-panel" aria-label="Route search and sensory route results">
            <div className="panel-intro">
              <div>
                <p className="eyebrow">Walking routes</p>
                <h2>{routeData?.destination.name ?? "Plan your journey"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Refresh route sensory ratings"
                title="Refresh ratings"
                onClick={() => void loadRoutes(startInput, destinationInput)}
              >
                <RefreshCw size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="start-control">
              <label htmlFor="start">Starting point</label>
              <div className="input-action-row">
                <input
                  id="start"
                  value={startInput}
                  onChange={(event) => setStartInput(event.target.value)}
                  placeholder="Melbourne Town Hall"
                />
                <button type="button" className="location-button" onClick={useCurrentLocationDemo} title="Use current location">
                  <LocateFixed size={16} aria-hidden="true" />
                  <span>Use current</span>
                </button>
              </div>
            </div>

            <div className="quick-section">
              <p>Popular destinations</p>
              <div className="chip-list" aria-label="Quick destination options">
                {destinations.slice(0, 5).map((destination) => (
                  <button
                    key={destination.id}
                    type="button"
                    className={routeData?.destination.id === destination.id ? "chip active-chip" : "chip"}
                    onClick={() => chooseDestination(destination)}
                  >
                    {destination.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={routeData?.data_status.is_fallback ? "data-status fallback" : "data-status live"} aria-label="Open data status">
              {routeData?.data_status.is_fallback ? (
                <AlertCircle size={18} aria-hidden="true" />
              ) : (
                <Database size={18} aria-hidden="true" />
              )}
              <div>
                <strong>{routeData?.data_status.source ?? "City of Melbourne Open Data"}</strong>
                <span>{routeData?.data_status.message ?? "Loading live pedestrian sensor data..."}</span>
              </div>
            </div>

            {loading && <div className="loading-card">Calculating sensory load from pedestrian count data...</div>}
            {error && <div className="error-card">{error}</div>}

            <div className="route-list">
              {!loading &&
                routeData?.routes.map((route) => (
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
              {starts.slice(0, 3).map((start) => (
                <button type="button" key={start.id} onClick={() => chooseStart(start)}>{start.name}</button>
              ))}
            </div>
          </aside>

          <section className="map-panel" aria-label="Map and route evidence">
            <div className="map-toolbar">
              <div>
                <p className="eyebrow">Selected route</p>
                <h2>{selectedRoute?.route_name ?? "Loading route"}</h2>
              </div>
              <div className="map-legend" aria-label="Map sensor legend">
                <strong>Pedestrian sensors</strong>
                <span><i className="legend-symbol low-symbol" /> Low activity</span>
                <span><i className="legend-symbol high-symbol" /> High activity</span>
              </div>
            </div>

            <div className="map-frame">
              {routeData?.routes.length ? (
                <RouteMap
                  start={routeData.start}
                  destination={routeData.destination}
                  routes={routeData.routes}
                  sensors={routeData.sensors}
                  selectedRouteId={selectedRoute?.id}
                  onRouteSelect={(routeId) => {
                    setSelectedRouteId(routeId);
                    setExpandedRouteId(routeId);
                  }}
                />
              ) : (
                <div className="map-loading">Map is preparing route and sensor data...</div>
              )}
            </div>

            <div className="map-footer">
              <span>Powered by City of Melbourne Open Data</span>
              <span>{routeData?.routing_status.provider ?? "Preset Melbourne CBD routes"}</span>
            </div>
          </section>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <p className="eyebrow">Transparent by design</p>
            <h2>How sensory ratings work</h2>
            <p>Simple evidence, visible reasoning, and no mystery score.</p>
          </div>
          <div className="steps">
            <article><span>01</span><Route size={22} aria-hidden="true" /><h3>Map route segments</h3><p>We trace each walking option through Melbourne CBD street blocks.</p></article>
            <article><span>02</span><Activity size={22} aria-hidden="true" /><h3>Read pedestrian data</h3><p>Nearby City of Melbourne sensors reveal activity along the journey.</p></article>
            <article><span>03</span><Footprints size={22} aria-hidden="true" /><h3>Make it understandable</h3><p>Routes become clear Low or High sensory-load choices with supporting evidence.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>sensory.routes · FIT5120 prototype</span>
        <span>Designed for calmer urban journeys</span>
      </footer>
    </div>
  );
}

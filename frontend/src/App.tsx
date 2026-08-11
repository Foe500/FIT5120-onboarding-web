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
import type { Place, RatingResponse } from "./types";

const defaultStart = "Melbourne Town Hall";

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

  async function loadRoutes(start: string, destination: string) {
    if (!destination.trim()) {
      setError("Enter a destination in Melbourne CBD to continue.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = await getRatedRoutes(start, destination);
      setRouteData(payload);
      setSelectedRouteId(payload.routes[0]?.id ?? "");
      setExpandedRouteId(payload.routes[0]?.id ?? "");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
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
    setStartInput(defaultStart);
    if (routeData) void loadRoutes(defaultStart, destinationInput);
  }

  function chooseDestination(destination: Place) {
    setDestinationInput(destination.name);
    if (routeData) void loadRoutes(startInput, destination.name);
  }

  function chooseStart(start: Place) {
    setStartInput(start.name);
    if (routeData) void loadRoutes(start.name, destinationInput);
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
          <section className="welcome-panel" aria-labelledby="welcome-heading">
            <p className="eyebrow">Building sensory-friendly urban futures</p>
            <h1 id="welcome-heading">Welcome!</h1>
            <div className="location-summary">
              <span className="location-icon"><MapPin size={23} aria-hidden="true" /></span>
              <div>
                <span>Starting from</span>
                <strong>{startInput || "Choose a starting point"}</strong>
              </div>
            </div>
            <p className="welcome-note">Plan a walking journey with clearer information about pedestrian activity and sensory load.</p>
            <dl className="coverage-list">
              <div><dt>Route data</dt><dd>Live and historical</dd></div>
              <div><dt>Coverage</dt><dd>Melbourne CBD</dd></div>
              <div><dt>Sensory levels</dt><dd>Low and High</dd></div>
            </dl>
          </section>

          <section className="journey-card" aria-labelledby="journey-heading">
            <p className="eyebrow">Plan a calmer journey</p>
            <h2 id="journey-heading">Where would you<br />like to go?</h2>
            <p className="journey-intro">We will compare walking routes using pedestrian activity and sensory information.</p>

            <form className="journey-form" onSubmit={submitSearch}>
              <label htmlFor="start">Starting point</label>
              <span className="field-context">Choose a known location in Melbourne CBD</span>
              <div className="search-field">
                <input
                  id="start"
                  list="start-options"
                  value={startInput}
                  onChange={(event) => setStartInput(event.target.value)}
                  placeholder="Search starting point"
                />
                <Search size={21} aria-hidden="true" />
              </div>
              <datalist id="start-options">
                {starts.map((start) => <option key={start.id} value={start.name} />)}
              </datalist>

              <label htmlFor="destination">Destination</label>
              <div className="search-field">
                <input
                  id="destination"
                  list="destination-options"
                  value={destinationInput}
                  onChange={(event) => setDestinationInput(event.target.value)}
                  placeholder="Search destination"
                  autoComplete="off"
                />
                <Search size={21} aria-hidden="true" />
              </div>
              <datalist id="destination-options">
                {destinations.map((destination) => <option key={destination.id} value={destination.name} />)}
              </datalist>

              <div className="suggestion-row" aria-label="Popular destinations">
                {destinations.slice(0, 3).map((destination) => (
                  <button type="button" key={destination.id} onClick={() => setDestinationInput(destination.name)}>
                    {destination.name}
                  </button>
                ))}
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="find-routes-button" type="submit" disabled={loading}>
                {loading ? "Comparing routes..." : "Find routes"}
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
                  <input id="result-start" value={startInput} onChange={(event) => setStartInput(event.target.value)} />
                  <button type="button" className="location-button" onClick={useCurrentLocationDemo} title="Use current location">
                    <LocateFixed size={16} aria-hidden="true" /><span>Use current</span>
                  </button>
                </div>
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

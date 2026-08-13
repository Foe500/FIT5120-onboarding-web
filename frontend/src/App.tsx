import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CircleHelp,
  Database,
  Footprints,
  LocateFixed,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Waves
} from "lucide-react";
import { getPlaces, getRatedRoutes, getRefuges, searchPlaces } from "./api";
import RouteCard from "./components/RouteCard";
import RouteMap from "./components/RouteMap";
import type { Coordinates, Place, RatingResponse, RefugeCategory, RefugeLocation } from "./types";

const defaultStart = "Melbourne Town Hall";
const cbdBounds = { north: -37.8005, south: -37.8248, west: 144.946, east: 144.9735 };

function isWithinMelbourneCbd([latitude, longitude]: Coordinates) {
  return latitude <= cbdBounds.north && latitude >= cbdBounds.south && longitude >= cbdBounds.west && longitude <= cbdBounds.east;
}

export default function App() {
  const [starts, setStarts] = useState<Place[]>([]);
  const [destinations, setDestinations] = useState<Place[]>([]);
  const [startInput, setStartInput] = useState(defaultStart);
  const [selectedStart, setSelectedStart] = useState<Place | null>(null);
  const [startPlaceResults, setStartPlaceResults] = useState<Place[]>([]);
  const [startSearchMessage, setStartSearchMessage] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<Place | null>(null);
  const [placeResults, setPlaceResults] = useState<Place[]>([]);
  const [searchingField, setSearchingField] = useState<"start" | "destination" | null>(null);
  const [placeSearchMessage, setPlaceSearchMessage] = useState("");
  const [routeData, setRouteData] = useState<RatingResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [refuges, setRefuges] = useState<RefugeLocation[]>([]);
  const [refugeCategories, setRefugeCategories] = useState<RefugeCategory[]>([]);
  const [showRefuges, setShowRefuges] = useState(false);
  const [refugeCategory, setRefugeCategory] = useState<RefugeCategory | "All">("All");

  useEffect(() => {
    getPlaces()
      .then((payload) => {
        setStarts(payload.starts);
        setDestinations(payload.destinations);
      })
      .catch(() => setError("Preset CBD locations could not be loaded. You can still type a known destination."));
  }, []);

  useEffect(() => {
    getRefuges().then((payload) => {
      setRefuges(payload.refuges);
      setRefugeCategories(payload.categories);
    }).catch(() => setError("Sensory refuge locations could not be loaded."));
  }, []);

  const selectedRoute = useMemo(() => {
    if (!routeData?.routes.length) return undefined;
    return routeData.routes.find((route) => route.id === selectedRouteId) ?? routeData.routes[0];
  }, [routeData, selectedRouteId]);

  const startIsReady = Boolean(
    currentCoordinates
    || (selectedStart && selectedStart.name === startInput)
    || starts.some((start) => start.name.toLowerCase() === startInput.trim().toLowerCase())
  );
  const destinationIsReady = Boolean(
    (selectedDestination && selectedDestination.name === destinationInput)
    || destinations.some((destination) => destination.name.toLowerCase() === destinationInput.trim().toLowerCase())
  );
  const visibleRefuges = refugeCategory === "All" ? refuges : refuges.filter((refuge) => refuge.category === refugeCategory);

  async function loadRoutes(
    start: string,
    destination: string,
    startCoordinates = currentCoordinates,
    destinationPlace = selectedDestination,
    startPlace = selectedStart
  ) {
    if (!destination.trim()) {
      setError("Enter a destination in Melbourne CBD to continue.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const searchedStartCoordinates = startCoordinates
        ?? (startPlace?.id.startsWith("osm-") ? startPlace.coordinates : null);
      const searchedCoordinates = destinationPlace?.id.startsWith("osm-") ? destinationPlace.coordinates : null;
      const payload = await getRatedRoutes(start, destination, searchedStartCoordinates, searchedCoordinates);
      setRouteData(payload);
      setSelectedRouteId(payload.routes[0]?.id ?? "");
      setExpandedRouteId("");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Routes could not be loaded. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startValue = startInput.trim();
    const destinationValue = destinationInput.trim();
    if (!startValue) {
      setError("Enter a starting point in Melbourne CBD or use your current location.");
      return;
    }
    if (!destinationValue) {
      setError("Enter a destination in Melbourne CBD to continue.");
      return;
    }

    const startPreset = starts.find((start) => start.name.toLowerCase() === startValue.toLowerCase());
    const resolvedStart = selectedStart?.name === startInput ? selectedStart : startPreset ?? null;
    if (!currentCoordinates && !resolvedStart) {
      setSearchingField("start");
      setError("");
      setStartSearchMessage("");
      try {
        const payload = await searchPlaces(startValue);
        setStartPlaceResults(payload.results);
        setStartSearchMessage(payload.results.length
          ? "Choose the correct starting point, then continue your search."
          : "No matching starting points were found within Melbourne CBD.");
      } catch (requestError) {
        setStartPlaceResults([]);
        setError(requestError instanceof Error ? requestError.message : "Starting points could not be searched.");
      } finally {
        setSearchingField(null);
      }
      return;
    }

    if (startPreset && selectedStart !== startPreset) setSelectedStart(startPreset);

    const destinationPreset = destinations.find((destination) => destination.name.toLowerCase() === destinationValue.toLowerCase());
    const resolvedDestination = selectedDestination?.name === destinationInput ? selectedDestination : destinationPreset ?? null;
    if (resolvedDestination) {
      setSelectedDestination(resolvedDestination);
      await loadRoutes(startInput, resolvedDestination.name, currentCoordinates, resolvedDestination, resolvedStart);
      return;
    }

    setSearchingField("destination");
    setError("");
    setPlaceSearchMessage("");
    try {
      const payload = await searchPlaces(destinationValue);
      setPlaceResults(payload.results);
      setPlaceSearchMessage(payload.results.length
        ? "Choose the correct place to calculate its walking routes."
        : "No matching places were found within Melbourne CBD.");
    } catch (requestError) {
      setPlaceResults([]);
      setError(requestError instanceof Error ? requestError.message : "Places could not be searched.");
    } finally {
      setSearchingField(null);
    }
  }

  function selectSearchedStart(start: Place) {
    setSelectedStart(start);
    setStartInput(start.name);
    setCurrentCoordinates(null);
    setStartPlaceResults([]);
    setStartSearchMessage("");
    setLocationError("");
    setError("");
  }

  async function searchResultStart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = startInput.trim();
    if (!query) {
      setError("Enter a starting point in Melbourne CBD.");
      return;
    }

    const preset = starts.find((start) => start.name.toLowerCase() === query.toLowerCase());
    if (preset) {
      chooseStart(preset);
      return;
    }

    setSearchingField("start");
    setStartSearchMessage("");
    setError("");
    try {
      const payload = await searchPlaces(query);
      setStartPlaceResults(payload.results);
      setStartSearchMessage(payload.results.length
        ? "Choose a matching starting point to update the route."
        : "No matching starting points were found within Melbourne CBD.");
    } catch (requestError) {
      setStartPlaceResults([]);
      setError(requestError instanceof Error ? requestError.message : "Starting points could not be searched.");
    } finally {
      setSearchingField(null);
    }
  }

  function selectResultStart(start: Place) {
    setSelectedStart(start);
    setStartInput(start.name);
    setCurrentCoordinates(null);
    setStartPlaceResults([]);
    setStartSearchMessage("");
    setLocationError("");
    void loadRoutes(start.name, destinationInput, null, selectedDestination, start);
  }

  function selectSearchedDestination(destination: Place) {
    setSelectedDestination(destination);
    setDestinationInput(destination.name);
    setPlaceResults([]);
    setPlaceSearchMessage("");
    void loadRoutes(startInput, destination.name, currentCoordinates, destination, selectedStart);
  }

  function useCurrentLocation() {
    setLocationError("");
    setSelectedStart(null);
    setStartPlaceResults([]);
    setStartSearchMessage("");
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
        if (routeData) void loadRoutes("Current location", destinationInput, coordinates, selectedDestination, null);
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
    setSelectedDestination(destination);
    setDestinationInput(destination.name);
    setPlaceResults([]);
    setPlaceSearchMessage("");
    if (routeData) void loadRoutes(startInput, destination.name, currentCoordinates, destination, selectedStart);
  }

  function chooseStart(start: Place) {
    setCurrentCoordinates(null);
    setSelectedStart(start);
    setStartPlaceResults([]);
    setStartSearchMessage("");
    setLocationError("");
    setStartInput(start.name);
    if (routeData) void loadRoutes(start.name, destinationInput, null, selectedDestination, start);
  }

  function navigateToRefuge(refuge: RefugeLocation) {
    const destination: Place = { id: refuge.id, name: refuge.name, address: refuge.address, coordinates: refuge.coordinates };
    setSelectedDestination(destination);
    setDestinationInput(refuge.name);
    void loadRoutes(startInput, refuge.name, currentCoordinates, destination, selectedStart);
  }

  function resetPlanner() {
    setRouteData(null);
    setSelectedStart(null);
    setStartPlaceResults([]);
    setStartSearchMessage("");
    setDestinationInput("");
    setSelectedDestination(null);
    setPlaceResults([]);
    setPlaceSearchMessage("");
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
              <div><dt>Route language</dt><dd>Low / High / Unknown</dd></div>
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
                      setSelectedStart(null);
                      setCurrentCoordinates(null);
                      setStartPlaceResults([]);
                      setStartSearchMessage("");
                      setLocationError("");
                      setError("");
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
                {selectedStart?.id.startsWith("osm-") && <span className="field-message success" role="status">Starting point selected</span>}
                {locationError && <span className="field-message error" role="alert">{locationError}</span>}
                {startSearchMessage && <span className="place-search-message" role="status">{startSearchMessage}</span>}
                {startPlaceResults.length > 0 && (
                  <div className="place-results" aria-label="Matching starting points">
                    {startPlaceResults.map((start) => (
                      <button type="button" key={start.id} onClick={() => selectSearchedStart(start)}>
                        <MapPin size={16} aria-hidden="true" />
                        <span><strong>{start.name}</strong><small>{start.address}</small></span>
                      </button>
                    ))}
                  </div>
                )}
                <a className="geocoding-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Place search © OpenStreetMap contributors</a>
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
                    onChange={(event) => {
                      setDestinationInput(event.target.value);
                      setSelectedDestination(null);
                      setPlaceResults([]);
                      setPlaceSearchMessage("");
                      setError("");
                    }}
                    placeholder="Search destination"
                    autoComplete="off"
                  />
                </div>
                {placeSearchMessage && <span className="place-search-message" role="status">{placeSearchMessage}</span>}
                {placeResults.length > 0 && (
                  <div className="place-results" aria-label="Matching destinations">
                    {placeResults.map((destination) => (
                      <button type="button" key={destination.id} onClick={() => selectSearchedDestination(destination)}>
                        <MapPin size={16} aria-hidden="true" />
                        <span><strong>{destination.name}</strong><small>{destination.address}</small></span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="suggestion-row" aria-label="Popular destinations">
                  {destinations.slice(0, 3).map((destination) => (
                    <button type="button" key={destination.id} onClick={() => chooseDestination(destination)}>
                      {destination.name}
                    </button>
                  ))}
                </div>
                <a className="geocoding-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Place search © OpenStreetMap contributors</a>
              </div>
              <datalist id="destination-options">
                {destinations.map((destination) => <option key={destination.id} value={destination.name} />)}
              </datalist>

              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="find-routes-button" type="submit" disabled={loading || searchingField !== null}>
                <span>{searchingField === "start" ? "Searching starting points..." : searchingField === "destination" ? "Searching destinations..." : loading ? "Comparing routes..." : !startIsReady ? "Search starting point" : !destinationIsReady ? "Search destination" : "Compare routes"}</span>
                {startIsReady && destinationIsReady ? <Route size={19} aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}
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
                <button type="button" className="icon-button" aria-label="Refresh route sensory ratings" title="Refresh ratings" onClick={() => void loadRoutes(startInput, destinationInput, currentCoordinates, selectedDestination)}>
                  <RefreshCw size={17} aria-hidden="true" />
                </button>
              </div>

              <div className="start-control">
                <label htmlFor="result-start">Starting point</label>
                <form onSubmit={searchResultStart}>
                  <div className="input-action-row">
                    <input
                      id="result-start"
                      value={startInput}
                      onChange={(event) => {
                        setStartInput(event.target.value);
                        setSelectedStart(null);
                        setCurrentCoordinates(null);
                        setStartPlaceResults([]);
                        setStartSearchMessage("");
                        setLocationError("");
                      }}
                      aria-describedby="result-start-help"
                    />
                    <button type="submit" className="location-button" disabled={searchingField === "start"} title="Search starting point">
                      <Search size={16} aria-hidden="true" /><span>{searchingField === "start" ? "Searching..." : "Update"}</span>
                    </button>
                  </div>
                </form>
                <span id="result-start-help" className="result-input-help">Enter an address, then choose a matching location.</span>
                {startSearchMessage && <span className="result-location-status" role="status">{startSearchMessage}</span>}
                {startPlaceResults.length > 0 && (
                  <div className="result-place-results" aria-label="Matching starting points">
                    {startPlaceResults.map((start) => (
                      <button type="button" key={start.id} onClick={() => selectResultStart(start)}>
                        <MapPin size={15} aria-hidden="true" />
                        <span><strong>{start.name}</strong><small>{start.address}</small></span>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" className="location-button result-current-location" onClick={useCurrentLocation} disabled={locating} title="Use current location">
                  <LocateFixed size={16} aria-hidden="true" /><span>{locating ? "Locating..." : "Use current location"}</span>
                </button>
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
                {routeData.data_status.is_live ? <Database size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
                <div><strong>{routeData.data_status.is_live ? routeData.data_status.source : "Not live pedestrian data"}</strong><span>{routeData.data_status.message}</span></div>
              </div>

              <div className={routeData.routing_status.is_live_routing ? "routing-status live" : "routing-status fallback"} aria-label="Walking route source">
                <Route size={18} aria-hidden="true" />
                <div>
                  <strong>{routeData.routing_status.is_live_routing ? "Live walking geometry" : "Fallback route geometry"}</strong>
                  <span>{routeData.routing_status.message}</span>
                </div>
              </div>

              <div className="refuge-controls" aria-label="Sensory refuge locations">
                <button type="button" className={showRefuges ? "refuge-toggle active" : "refuge-toggle"} onClick={() => setShowRefuges(!showRefuges)} aria-pressed={showRefuges}>
                  {showRefuges ? "Hide sensory refuges" : "Show sensory refuges"}
                </button>
                {showRefuges && <div className="refuge-filters" aria-label="Filter sensory refuges by category">
                  <button type="button" className={refugeCategory === "All" ? "active" : ""} onClick={() => setRefugeCategory("All")}>All</button>
                  {refugeCategories.map((category) => <button type="button" key={category} className={refugeCategory === category ? "active" : ""} onClick={() => setRefugeCategory(category)}>{category}</button>)}
                </div>}
              </div>

              {loading && <div className="loading-card">Calculating sensory load from pedestrian count data...</div>}
              {error && <div className="error-card">{error}</div>}
              <div className={`congestion-guidance ${routeData.congestion_guidance.status}`} role="status">
                <AlertCircle size={18} aria-hidden="true" />
                <div><strong>{routeData.congestion_guidance.status === "lower_congestion_route_available" ? "Lower-congestion route recommended" : routeData.congestion_guidance.status === "no_lower_congestion_route_available" ? "No lower-congestion route available" : "No congested corridor identified"}</strong><span>{routeData.congestion_guidance.message}</span></div>
              </div>

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
                <div className="map-legend" aria-label="Map pedestrian activity legend">
                  <strong>Pedestrian activity</strong>
                  {selectedRoute?.sensory_level === "Unknown" ? (
                    <span><CircleHelp size={14} aria-hidden="true" /> No nearby sensor data</span>
                  ) : (
                    <>
                      <span><i className="legend-symbol low-symbol" /> Low activity</span>
                      <span><i className="legend-symbol high-symbol" /> Congested corridor</span>
                    </>
                  )}
                </div>
              </div>
              <div className="map-frame">
                <RouteMap
                  start={routeData.start}
                  destination={routeData.destination}
                  routes={routeData.routes}
                  selectedRouteId={selectedRoute?.id}
                  refuges={visibleRefuges}
                  showRefuges={showRefuges}
                  onNavigateRefuge={navigateToRefuge}
                  onRouteSelect={(routeId) => { setSelectedRouteId(routeId); setExpandedRouteId(routeId); }}
                />
              </div>
              <div className="map-footer">
                <span>Pedestrian activity: City of Melbourne Open Data</span>
                {routeData.routing_status.is_live_routing ? (
                  <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer">Routing: FOSSGIS OSRM + OpenStreetMap</a>
                ) : (
                  <span>{routeData.routing_status.provider}</span>
                )}
              </div>
            </section>
          </section>

          <section className="how-section" id="how-it-works">
            <div className="how-heading"><p className="eyebrow">Transparent by design</p><h2>How sensory ratings work</h2><p>Simple evidence, visible reasoning, and no mystery score.</p></div>
            <div className="steps">
              <article><span>01</span><Route size={22} aria-hidden="true" /><h3>Map route segments</h3><p>We trace each walking option through Melbourne CBD street blocks.</p></article>
              <article><span>02</span><Activity size={22} aria-hidden="true" /><h3>Read pedestrian data</h3><p>Nearby City of Melbourne sensors reveal activity along the journey.</p></article>
              <article><span>03</span><Footprints size={22} aria-hidden="true" /><h3>Make it understandable</h3><p>Routes show Low or High sensory load when evidence exists, and Unknown when nearby data is insufficient.</p></article>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer"><span>sensory.routes · FIT5120 prototype</span><span>Designed for calmer urban journeys</span></footer>
    </div>
  );
}

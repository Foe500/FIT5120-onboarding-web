# Building Sensory-Friendly Urban Futures

FIT5120 onboarding prototype web app: **Hush**, a sensory-aware route planner for Melbourne CBD.

The app helps sensory-sensitive and neurodivergent commuters compare calmer walking routes. Users can choose a starting point and destination, view route options on a Leaflet/OpenStreetMap interface, and inspect why each route receives a Low or High sensory-load rating.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Map: Leaflet + React Leaflet + OpenStreetMap tiles
- Backend: Node.js + Express
- Routing: public FOSSGIS OSRM foot-routing service, with no API key required
- Geocoding: public OpenStreetMap Nominatim search, limited to Melbourne CBD
- Data: City of Melbourne pedestrian-counting open data, with local fallback data for reliable demos

## Project Structure

```text
hush-sensory-navigation/
|-- backend/
|   |-- src/
|   |   |-- data/          CBD places, preset routes, fallback sensors
|   |   |-- services/      Open data, routing, geo, sensory-rating logic
|   |   `-- index.js       Express API entry
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/    Route cards and Leaflet map
|   |   |-- App.tsx        Main product screen
|   |   |-- api.ts         Frontend API client
|   |   `-- styles.css     Responsive app styling
|   |-- .env.example
|   |-- index.html
|   `-- package.json
|-- package.json           Root scripts
`-- README.md
```

## Run Locally

Install dependencies:

```bash
npm run install:all
```

Start frontend and backend together:

```bash
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

Build check:

```bash
npm run check
```

## API Endpoints

Backend default URL: `http://localhost:4000`

```text
GET /api/health
GET /api/places
GET /api/geocode?q=120%20Collins%20Street
GET /api/sensors/live
GET /api/routes
GET /api/routes/sensory-rating
```

Example:

```text
/api/routes/sensory-rating?start=Melbourne%20Town%20Hall&destination=State%20Library%20Victoria
```

Current-location requests include browser-provided coordinates:

```text
/api/routes/sensory-rating?start=Current%20location&destination=State%20Library%20Victoria&startLat=-37.8136&startLng=144.9631
```

Both coordinate fields are required and must fall within the prototype's Melbourne CBD coverage area. Browser geolocation is available on `localhost` and HTTPS deployments after the user grants permission.

## Real Walking Routes

The backend requests street-following walking geometry from the public [FOSSGIS OSRM routing service](https://routing.openstreetmap.de/about.html). The browser never calls the routing provider directly: Express applies a request queue, timeout, and five-minute in-memory cache, then converts OSRM GeoJSON into the route format used by the sensory-rating service.

- No registration or API key is required.
- Requests are limited to approximately one per second.
- If live routing is unavailable, the API returns the existing preset routes and marks the response as fallback data.
- The public endpoint is appropriate for a prototype, not heavy production traffic. Its operator also states that route requests are logged.

The frontend displays whether the current geometry is live or fallback and includes routing attribution beside the map.

## Place Search

Destination searches use the public OpenStreetMap Nominatim API. The Express backend limits requests to one at a time with at least 1.1 seconds between calls, caches successful searches for 24 hours, identifies the application with a custom User-Agent, and restricts results to the Melbourne CBD sensory-data coverage area.

Search is triggered only when the user submits the form. It is intentionally not implemented as per-keystroke autocomplete because that usage is prohibited by the public Nominatim policy. The user selects one of up to five address results before its coordinates are sent to the walking-route service.

## Sensory Rating Rule

Initial onboarding rule:

- Low sensory load: average nearby pedestrian count `< 50`
- High sensory load: average nearby pedestrian count `>= 50`

The explanation panel also shows nearby sensor count, average pedestrian count, highest pedestrian count, top contributing sensors, and data-source status.

## Deployment

Split deployment is recommended:

- Deploy `backend/` to a Node host such as Render, Railway, Fly.io, or an Express-compatible server.
- Deploy `frontend/` to Vercel, Netlify, or any static hosting service.
- Set frontend environment variable `VITE_API_BASE_URL` to the deployed backend URL.

Example:

```text
VITE_API_BASE_URL=https://your-backend.example.com
```

Backend environment:

```text
PORT=4000
```

The prototype does not require private API keys. City of Melbourne data and the FOSSGIS route endpoint are public, while local route and sensor fallbacks keep the demo usable if either live service is unavailable.

## Prototype Scope

- Search for arbitrary addresses and places within Melbourne CBD
- Real street-following walking routes for selected CBD places and valid current-location coordinates
- Browser geolocation for dynamic starting coordinates within Melbourne CBD
- Approximate sensor-to-route matching
- Rating based on pedestrian crowd density only

Future iterations can expand search beyond the CBD, add a production geocoding and routing provider with an SLA, event data, construction disruptions, noise data, lighting conditions, and personalised sensory thresholds.

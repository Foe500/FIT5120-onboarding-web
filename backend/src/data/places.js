export const cbdBounds = {
  north: -37.8005,
  south: -37.8248,
  west: 144.946,
  east: 144.9735
};

export const startPresets = [
  {
    id: "melbourne-town-hall",
    name: "Melbourne Town Hall",
    address: "90-130 Swanston St, Melbourne VIC",
    coordinates: [-37.815, 144.9669]
  },
  {
    id: "flinders-street-station",
    name: "Flinders Street Station",
    address: "Flinders St, Melbourne VIC",
    coordinates: [-37.8183, 144.9671]
  },
  {
    id: "southern-cross-station",
    name: "Southern Cross Station",
    address: "Spencer St, Docklands VIC",
    coordinates: [-37.8183, 144.9525]
  },
  {
    id: "parliament-station",
    name: "Parliament Station",
    address: "Spring St, Melbourne VIC",
    coordinates: [-37.8119, 144.972]
  }
];

export const destinationPresets = [
  {
    id: "state-library-victoria",
    name: "State Library Victoria",
    address: "328 Swanston St, Melbourne VIC",
    coordinates: [-37.8098, 144.9652]
  },
  {
    id: "flinders-street-station",
    name: "Flinders Street Station",
    address: "Flinders St, Melbourne VIC",
    coordinates: [-37.8183, 144.9671]
  },
  {
    id: "melbourne-central",
    name: "Melbourne Central",
    address: "Cnr La Trobe St and Swanston St, Melbourne VIC",
    coordinates: [-37.8107, 144.9629]
  },
  {
    id: "queen-victoria-market",
    name: "Queen Victoria Market",
    address: "Queen St, Melbourne VIC",
    coordinates: [-37.8076, 144.9568]
  },
  {
    id: "rmit-university",
    name: "RMIT University",
    address: "124 La Trobe St, Melbourne VIC",
    coordinates: [-37.8084, 144.9639]
  }
];

export function findPlace(query, presets, fallback) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return fallback;

  return (
    presets.find((place) => {
      return (
        place.id === value ||
        place.name.toLowerCase() === value ||
        place.name.toLowerCase().includes(value) ||
        place.address.toLowerCase().includes(value)
      );
    }) || fallback
  );
}

export function isWithinCbd([lat, lon]) {
  return lat <= cbdBounds.north && lat >= cbdBounds.south && lon >= cbdBounds.west && lon <= cbdBounds.east;
}

const routeKey = (startId, destinationId) => `${startId}__${destinationId}`;

const defaultRouteSets = {
  [routeKey("melbourne-town-hall", "state-library-victoria")]: [
    {
      id: "mtownhall-state-library-swanston",
      name: "Swanston Street direct",
      mode: "Direct",
      summary: "Shortest walk through the central CBD spine.",
      estimated_walking_time: "9 min",
      walking_time_minutes: 9,
      distance_meters: 720,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8134, 144.9667],
        [-37.8119, 144.9659],
        [-37.8098, 144.9652]
      ]
    },
    {
      id: "mtownhall-state-library-russell",
      name: "Russell Street calmer option",
      mode: "Calmer",
      summary: "Slightly longer route avoiding the busiest Swanston blocks.",
      estimated_walking_time: "12 min",
      walking_time_minutes: 12,
      distance_meters: 930,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8144, 144.9692],
        [-37.8124, 144.9694],
        [-37.8101, 144.9663],
        [-37.8098, 144.9652]
      ]
    },
    {
      id: "mtownhall-state-library-queen",
      name: "Queen Street low-stimulation loop",
      mode: "Low-stimulation",
      summary: "A slower option through less crowded western streets.",
      estimated_walking_time: "14 min",
      walking_time_minutes: 14,
      distance_meters: 1100,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8146, 144.9615],
        [-37.8121, 144.9607],
        [-37.8104, 144.963],
        [-37.8098, 144.9652]
      ]
    }
  ],
  [routeKey("melbourne-town-hall", "melbourne-central")]: [
    {
      id: "mtownhall-central-swanston",
      name: "Swanston Street northbound",
      mode: "Direct",
      summary: "Direct path toward Melbourne Central and RMIT.",
      estimated_walking_time: "8 min",
      walking_time_minutes: 8,
      distance_meters: 650,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8136, 144.9667],
        [-37.8118, 144.9646],
        [-37.8107, 144.9629]
      ]
    },
    {
      id: "mtownhall-central-queen",
      name: "Queen Street west option",
      mode: "Calmer",
      summary: "Longer route through lower-density western sensors.",
      estimated_walking_time: "13 min",
      walking_time_minutes: 13,
      distance_meters: 1050,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8148, 144.9615],
        [-37.8124, 144.9605],
        [-37.8107, 144.9629]
      ]
    }
  ],
  [routeKey("melbourne-town-hall", "flinders-street-station")]: [
    {
      id: "mtownhall-flinders-direct",
      name: "Swanston Street southbound",
      mode: "Direct",
      summary: "The most direct walk to Flinders Street Station.",
      estimated_walking_time: "6 min",
      walking_time_minutes: 6,
      distance_meters: 500,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8162, 144.967],
        [-37.8174, 144.9671],
        [-37.8183, 144.9671]
      ]
    },
    {
      id: "mtownhall-flinders-collins",
      name: "Collins Street approach",
      mode: "Calmer",
      summary: "Avoids some of the Swanston pedestrian pressure.",
      estimated_walking_time: "9 min",
      walking_time_minutes: 9,
      distance_meters: 710,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8156, 144.965],
        [-37.8174, 144.9654],
        [-37.8183, 144.9671]
      ]
    }
  ],
  [routeKey("melbourne-town-hall", "queen-victoria-market")]: [
    {
      id: "mtownhall-qvm-elizabeth",
      name: "Elizabeth Street route",
      mode: "Balanced",
      summary: "A central route with moderate pedestrian activity.",
      estimated_walking_time: "15 min",
      walking_time_minutes: 15,
      distance_meters: 1200,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8135, 144.9622],
        [-37.8108, 144.9602],
        [-37.8076, 144.9568]
      ]
    },
    {
      id: "mtownhall-qvm-flagstaff",
      name: "Flagstaff Gardens route",
      mode: "Low-stimulation",
      summary: "Longer route near open green space for a calmer journey.",
      estimated_walking_time: "18 min",
      walking_time_minutes: 18,
      distance_meters: 1450,
      coordinates: [
        [-37.815, 144.9669],
        [-37.8138, 144.9584],
        [-37.81, 144.9554],
        [-37.8076, 144.9568]
      ]
    }
  ]
};

export function getPresetRoutes(start, destination) {
  const exact = defaultRouteSets[routeKey(start.id, destination.id)];
  if (exact) return exact;

  return [
    {
      id: `${start.id}-${destination.id}-direct`,
      name: "CBD direct route",
      mode: "Direct",
      summary: "Preset straight-line route for onboarding demonstration.",
      estimated_walking_time: "10 min",
      walking_time_minutes: 10,
      distance_meters: 850,
      coordinates: [start.coordinates, destination.coordinates]
    },
    {
      id: `${start.id}-${destination.id}-calmer`,
      name: "Calmer CBD route",
      mode: "Calmer",
      summary: "Preset alternative route designed for lower sensory intensity.",
      estimated_walking_time: "13 min",
      walking_time_minutes: 13,
      distance_meters: 1050,
      coordinates: [
        start.coordinates,
        [(start.coordinates[0] + destination.coordinates[0]) / 2, start.coordinates[1] - 0.004],
        destination.coordinates
      ]
    }
  ];
}

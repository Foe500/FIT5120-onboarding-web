import L from "leaflet";

export function sensorIcon(level: "Low" | "High") {
  const label = level === "High" ? "High" : "Low";
  return L.divIcon({
    className: `sensor-marker sensor-marker-${level.toLowerCase()}`,
    html: `<span aria-hidden="true">${level === "High" ? "!" : "✓"}</span><strong>${label}</strong>`,
    iconSize: [58, 34],
    iconAnchor: [29, 17]
  });
}

export function congestionIcon() {
  return L.divIcon({
    className: "congestion-marker",
    html: '<span aria-hidden="true">!</span><strong>Congested</strong>',
    iconSize: [98, 36],
    iconAnchor: [49, 18]
  });
}

export function labelIcon(label: string, className: string) {
  return L.divIcon({
    className,
    html: `<span>${label}</span>`,
    iconSize: [92, 30],
    iconAnchor: [46, 15]
  });
}

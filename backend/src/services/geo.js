const EARTH_RADIUS_METRES = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceMetres(a, b) {
  const dLat = toRadians(b[0] - a[0]);
  const dLon = toRadians(b[1] - a[1]);
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

function projectToLocalMetres(origin, point) {
  const latMetres = 111320;
  const lonMetres = 111320 * Math.cos(toRadians(origin[0]));
  return {
    x: (point[1] - origin[1]) * lonMetres,
    y: (point[0] - origin[0]) * latMetres
  };
}

function distancePointToSegment(point, segmentStart, segmentEnd) {
  const origin = segmentStart;
  const p = projectToLocalMetres(origin, point);
  const a = projectToLocalMetres(origin, segmentStart);
  const b = projectToLocalMetres(origin, segmentEnd);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distanceMetres(point, segmentStart);

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const closest = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.sqrt((p.x - closest.x) ** 2 + (p.y - closest.y) ** 2);
}

export function distanceToPolyline(point, coordinates) {
  if (coordinates.length < 2) return coordinates.length === 1 ? distanceMetres(point, coordinates[0]) : Infinity;
  const distances = [];
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    distances.push(distancePointToSegment(point, coordinates[i], coordinates[i + 1]));
  }
  return Math.min(...distances);
}

export function nearestPointOnPolyline(point, coordinates) {
  if (coordinates.length === 0) return null;
  if (coordinates.length === 1) return coordinates[0];

  let nearestPoint = coordinates[0];
  let shortestDistance = Infinity;
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const segmentStart = coordinates[i];
    const segmentEnd = coordinates[i + 1];
    const origin = segmentStart;
    const p = projectToLocalMetres(origin, point);
    const b = projectToLocalMetres(origin, segmentEnd);
    const lengthSquared = b.x * b.x + b.y * b.y;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (p.x * b.x + p.y * b.y) / lengthSquared));
    const candidate = [
      segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * t,
      segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * t
    ];
    const distance = distanceMetres(point, candidate);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestPoint = candidate;
    }
  }
  return nearestPoint;
}

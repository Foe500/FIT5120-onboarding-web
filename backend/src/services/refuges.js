import { APPROVED_REFUGE_CATEGORIES, sensoryRefuges } from "../data/refuges.js";

export function validateRefugeLocation(location) {
  const [latitude, longitude] = location.coordinates ?? [];
  if (!location.name?.trim()) throw new TypeError("A refuge location requires a name.");
  if (!APPROVED_REFUGE_CATEGORIES.includes(location.category)) throw new TypeError("The refuge category is not approved.");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new TypeError("The refuge location requires valid geographic coordinates.");
  if (!location.source || !/^https?:\/\//.test(location.source)) throw new TypeError("The refuge location requires a traceable source.");
  return location;
}

export function getValidatedRefuges() {
  return sensoryRefuges.map(validateRefugeLocation);
}

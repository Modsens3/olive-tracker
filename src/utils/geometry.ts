// Helper function to convert degrees to radians
const toRad = (x: number) => (x * Math.PI) / 180;

// Calculate distance between two points in meters (Haversine formula)
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate perimeter of a polygon in meters
export const getPerimeter = (coords: { lat: number; lng: number }[]): number => {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const next = (i + 1) % coords.length;
    perimeter += getDistance(coords[i].lat, coords[i].lng, coords[next].lat, coords[next].lng);
  }
  return perimeter;
};

// Calculate area of a polygon in square meters (approximate using spherical projection)
// This is a simplified implementation suitable for small agricultural fields
export const getArea = (coords: { lat: number; lng: number }[]): number => {
  if (coords.length < 3) return 0;
  
  const R = 6371e3; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];
    
    area += toRad(p2.lng - p1.lng) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }

  area = (area * R * R) / 2;
  return Math.abs(area);
};

// Check if a point is inside a polygon (Ray casting algorithm)
export const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Convert square meters to Stremmata (1 Stremma = 1000 sqm)
export const toStremmata = (sqm: number): number => {
  return Number((sqm / 1000).toFixed(2));
};

// Convert square meters to Acres (1 Acre = ~4046.86 sqm)
export const toAcres = (sqm: number): number => {
  return Number((sqm / 4046.86).toFixed(2));
};

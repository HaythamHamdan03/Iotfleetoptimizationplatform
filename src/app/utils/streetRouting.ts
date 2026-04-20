// Street-snapping + polyline helpers on top of the OSRM service.
// Falls back to the original straight-line waypoints on any error.

import { fetchOSRMRoute, type LatLng } from '@/app/services/api';

export type { LatLng };

export async function fetchStreetRoute(points: LatLng[]): Promise<LatLng[]> {
  if (points.length < 2) return points;
  try {
    const path = await fetchOSRMRoute(points);
    return path ?? points;
  } catch (err) {
    console.warn('[streetRouting] OSRM failed, using straight line:', err);
    return points;
  }
}

// Haversine length of a polyline in kilometers.
export function polylineLength(path: LatLng[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const [lat1, lng1] = path[i - 1];
    const [lat2, lng2] = path[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += 2 * 6371 * Math.asin(Math.sqrt(a));
  }
  return total;
}

function perturbWaypoints(points: LatLng[], magnitude: number): LatLng[] {
  // Keep start (index 0) and end (last index) fixed; shift intermediate waypoints.
  return points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return p;
    const angle = Math.random() * Math.PI * 2;
    const r = magnitude * (0.6 + Math.random() * 0.4);
    return [p[0] + Math.sin(angle) * r, p[1] + Math.cos(angle) * r] as LatLng;
  });
}

/**
 * Compute a route that is meaningfully different from `previousPath` by perturbing
 * intermediate waypoints before querying OSRM. Escalates the perturbation until the
 * total distance differs from the previous route by at least `minDiffPct` percent.
 */
export async function fetchAlternateStreetRoute(
  points: LatLng[],
  previousPath: LatLng[] | null,
  minDiffPct = 5
): Promise<LatLng[]> {
  if (points.length < 2) return points;
  const prevLen = previousPath ? polylineLength(previousPath) : 0;

  let magnitude = 0.004; // ~400 m in Saudi latitudes
  let best: LatLng[] = [];

  for (let attempt = 0; attempt < 4; attempt++) {
    const perturbed = perturbWaypoints(points, magnitude);
    const path = await fetchStreetRoute(perturbed);
    best = path;
    if (!previousPath || prevLen < 0.001) return path;
    const diffPct = (Math.abs(polylineLength(path) - prevLen) / prevLen) * 100;
    if (diffPct >= minDiffPct) return path;
    magnitude *= 1.8;
  }

  return best;
}

// HTTP client for the Flask backend and third-party routing/geocoding services.
// Components and hooks should import from here — not call fetch directly.

import type {
  FleetRouteResponse,
  OptimizeApiResult,
  GeocodeApiResponse,
} from '@/app/types/api';
import type { ESP32Response } from '@/app/types/iot';

const OPTIMIZER_URL = '/optimizer';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface OptimizeRequest {
  n_customers: number;
  n_vehicles: number;
  w_cost: number;
  w_co2: number;
  w_fairness: number;
  seed?: number;
}

export async function optimizeRoute(body: OptimizeRequest): Promise<OptimizeApiResult> {
  const res = await fetch(`${OPTIMIZER_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<OptimizeApiResult>;
}

export async function fetchFleetRoutes(): Promise<FleetRouteResponse> {
  const res = await fetch(`${OPTIMIZER_URL}/fleet-routes`);
  if (!res.ok) throw new Error(`fleet-routes HTTP ${res.status}`);
  return res.json() as Promise<FleetRouteResponse>;
}

export async function geocodeAddress(query: string): Promise<GeocodeApiResponse> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data && (data.error as string)) || 'address_not_found';
    throw new Error(err);
  }
  return data as GeocodeApiResponse;
}

export async function fetchIoTDeviceData(): Promise<ESP32Response> {
  const res = await fetch('/iot-device/data');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ESP32Response>;
}

// ── OSRM street routing ──────────────────────────────────────────────────────

export type LatLng = [number, number];

export async function fetchOSRMRoute(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2) return points;
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const geo = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(geo) || geo.length === 0) return null;
  return geo.map(([lng, lat]: [number, number]) => [lat, lng] as LatLng);
}

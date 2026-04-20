// Backend API response shapes (Flask app at /optimizer + /api).

export type StopStatus = 'completed' | 'current' | 'upcoming' | 'final';

export interface FleetStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  status: StopStatus;
}

export interface FleetVehicle {
  id: string;
  name: string;
  vehicle_type: 'ICE' | 'EV' | 'Hybrid';
  stops: FleetStop[];
  distance_km: number;
  cost_sar: number;
  co2_kg: number;
  load_kg: number;
  idle: boolean;
}

export interface FleetRouteResponse {
  depot: { name: string; lat: number; lon: number };
  vehicles: FleetVehicle[];
  source: 'optimized' | 'baseline';
}

export interface RouteEntry {
  vehicle: string;
  vehicle_type: string;
  route: number[];
  route_names: string[];
  distance_km: number;
  cost_sar: number;
  co2_kg: number;
  load_kg: number;
  capacity_util: number;
}

export interface OptimizeApiResult {
  status: 'success';
  n_customers: number;
  n_vehicles: number;
  baseline: {
    total_cost_sar: number;
    total_co2_kg: number;
    vehicles_used: number;
    workload_balance: number;
  };
  optimized: {
    total_cost_sar: number;
    total_co2_kg: number;
    total_distance_km: number;
    vehicles_used: number;
    fleet_utilization: number;
    workload_balance: number;
    status: string;
    solve_time_s: number;
    routes: Record<string, RouteEntry>;
  };
  comparison: {
    cost_reduction_pct: number;
    co2_reduction_pct: number;
    vehicles_baseline: number;
    vehicles_optimized: number;
    workload_baseline: number;
    workload_optimized: number;
    spec1_met: boolean;
    spec3_met: boolean;
    spec2_met: boolean;
  };
}

export interface GeocodeApiResponse {
  title?: string;
  formatted_address?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  city?: string;
  district?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  result_type?: string;
  query_score?: number;
  raw_response?: unknown;
  error?: string;
}

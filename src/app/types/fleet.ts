export interface Vehicle {
  id: string;
  name: string;
  type: 'truck' | 'ev' | 'drone';
  status: 'on-route' | 'delayed' | 'idle';
  lat: number;
  lng: number;
  driverId: string;
  driverName: string;
  batteryLevel?: number;
  fuelLevel?: number;
  currentLoad: number;
  maxLoad: number;
  routeStopIds: string[];
}

export type DeliveryStopType =
  | 'depot'
  | 'residential'
  | 'commercial'
  | 'office'
  | 'industrial'
  | 'landmark';

export interface DeliveryStop {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'completed' | 'current';
  type: DeliveryStopType;
  scheduledTime: string;
  actualTime: string | null;
  estimatedTime?: string;
  packageCount?: number;
}

export interface Route {
  id: string;
  vehicleId: string;
  driverId: string;
  stops: DeliveryStop[];
  totalDistance: number;
  estimatedDuration: number;
  status: 'active' | 'completed' | 'planned';
}

export interface KPIData {
  totalCost: number;
  co2Emissions: number;
  fleetUtilization: number;
  workloadFairness: number;
}

export interface OptimizationResult {
  routeId: string;
  vehicleId: string;
  driverName: string;
  stops: number;
  distance: number;
  cost: number;
  co2: number;
}

export interface Notification {
  id: string;
  type: 'route-update' | 'delay' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface DriverPerformance {
  totalDeliveries: number;
  onTimeRate: number;
  efficiency: number;
  workloadBalance: number;
}

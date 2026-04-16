// Mock data for the Fleet Management System

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
}

export interface DeliveryStop {
  id: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'completed' | 'current';
  estimatedTime: string;
  packageCount: number;
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

// Mock Vehicles - centered around Riyadh, Saudi Arabia
export const mockVehicles: Vehicle[] = [
  {
    id: 'V001',
    name: 'Truck-01',
    type: 'truck',
    status: 'on-route',
    lat: 24.7136,
    lng: 46.6753,
    driverId: 'D001',
    driverName: 'Ahmed Al-Rashid',
    fuelLevel: 75,
    currentLoad: 850,
    maxLoad: 1000,
  },
  {
    id: 'V002',
    name: 'EV-02',
    type: 'ev',
    status: 'on-route',
    lat: 24.7410,
    lng: 46.6720,
    driverId: 'D002',
    driverName: 'Mohammed Al-Saud',
    batteryLevel: 68,
    currentLoad: 600,
    maxLoad: 800,
  },
  {
    id: 'V003',
    name: 'Truck-03',
    type: 'truck',
    status: 'idle',
    lat: 24.6877,
    lng: 46.7219,
    driverId: 'D003',
    driverName: 'Khalid Al-Mansour',
    fuelLevel: 92,
    currentLoad: 0,
    maxLoad: 1000,
  },
  {
    id: 'V004',
    name: 'EV-04',
    type: 'ev',
    status: 'delayed',
    lat: 24.7593,
    lng: 46.6947,
    driverId: 'D004',
    driverName: 'Fahad Al-Najjar',
    batteryLevel: 45,
    currentLoad: 720,
    maxLoad: 800,
  },
  {
    id: 'V005',
    name: 'Truck-05',
    type: 'truck',
    status: 'on-route',
    lat: 24.6500,
    lng: 46.7167,
    driverId: 'D005',
    driverName: 'Omar Al-Qassim',
    fuelLevel: 58,
    currentLoad: 900,
    maxLoad: 1000,
  },
  {
    id: 'V006',
    name: 'EV-06',
    type: 'ev',
    status: 'idle',
    lat: 24.7780,
    lng: 46.7380,
    driverId: 'D006',
    driverName: 'Abdullah Al-Farsi',
    batteryLevel: 88,
    currentLoad: 0,
    maxLoad: 800,
  },
];

// Mock Delivery Stops for current driver (D002)
export const mockDeliveryStops: DeliveryStop[] = [
  {
    id: 'S001',
    address: 'Al Olaya District, Riyadh',
    lat: 24.6949,
    lng: 46.6857,
    status: 'completed',
    estimatedTime: '08:30 AM',
    packageCount: 3,
  },
  {
    id: 'S002',
    address: 'King Fahd Road, Riyadh',
    lat: 24.7136,
    lng: 46.6753,
    status: 'completed',
    estimatedTime: '09:15 AM',
    packageCount: 5,
  },
  {
    id: 'S003',
    address: 'Al Malqa District, Riyadh',
    lat: 24.7410,
    lng: 46.6720,
    status: 'current',
    estimatedTime: '10:00 AM',
    packageCount: 4,
  },
  {
    id: 'S004',
    address: 'Diplomatic Quarter, Riyadh',
    lat: 24.7593,
    lng: 46.6947,
    status: 'pending',
    estimatedTime: '10:45 AM',
    packageCount: 2,
  },
  {
    id: 'S005',
    address: 'Al Nakheel District, Riyadh',
    lat: 24.7780,
    lng: 46.7380,
    status: 'pending',
    estimatedTime: '11:30 AM',
    packageCount: 6,
  },
];

// Mock KPI Data
export const mockKPIData: KPIData = {
  totalCost: 45280,
  co2Emissions: 2847,
  fleetUtilization: 73,
  workloadFairness: 0.82,
};

// Mock Optimization Results
export interface OptimizationResult {
  routeId: string;
  vehicleId: string;
  driverName: string;
  stops: number;
  distance: number;
  cost: number;
  co2: number;
}

export const mockOptimizationResults: OptimizationResult[] = [
  {
    routeId: 'R001',
    vehicleId: 'V001',
    driverName: 'Ahmed Al-Rashid',
    stops: 8,
    distance: 45.2,
    cost: 520,
    co2: 38.5,
  },
  {
    routeId: 'R002',
    vehicleId: 'V002',
    driverName: 'Mohammed Al-Saud',
    stops: 6,
    distance: 32.8,
    cost: 380,
    co2: 12.3,
  },
  {
    routeId: 'R003',
    vehicleId: 'V005',
    driverName: 'Omar Al-Qassim',
    stops: 7,
    distance: 38.4,
    cost: 465,
    co2: 32.1,
  },
];

// Mock Analytics Data - Cost vs CO2 over time
export const mockCostCO2Data = [
  { date: 'Jan', cost: 42000, co2: 2950 },
  { date: 'Feb', cost: 41500, co2: 2820 },
  { date: 'Mar', cost: 43200, co2: 2900 },
  { date: 'Apr', cost: 44800, co2: 3100 },
  { date: 'May', cost: 45280, co2: 2847 },
];

// Mock Fleet Utilization Over Time
export const mockUtilizationData = [
  { time: '00:00', utilization: 45 },
  { time: '04:00', utilization: 38 },
  { time: '08:00', utilization: 68 },
  { time: '12:00', utilization: 82 },
  { time: '16:00', utilization: 75 },
  { time: '20:00', utilization: 58 },
];

// Mock Driver Workload Distribution
export const mockWorkloadData = [
  { driver: 'Ahmed', deliveries: 42, hours: 38 },
  { driver: 'Mohammed', deliveries: 38, hours: 36 },
  { driver: 'Khalid', deliveries: 45, hours: 40 },
  { driver: 'Fahad', deliveries: 40, hours: 37 },
  { driver: 'Omar', deliveries: 43, hours: 39 },
  { driver: 'Abdullah', deliveries: 39, hours: 35 },
];

// Mock Notifications
export interface Notification {
  id: string;
  type: 'route-update' | 'delay' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: 'N001',
    type: 'route-update',
    title: 'Route Updated',
    message: 'Your delivery route has been optimized. Check the new sequence.',
    time: '10 min ago',
    read: false,
  },
  {
    id: 'N002',
    type: 'message',
    title: 'Message from Dispatcher',
    message: 'Please prioritize deliveries in Al Malqa District today.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'N003',
    type: 'delay',
    title: 'Traffic Alert',
    message: 'Heavy traffic reported on King Fahd Road. Consider alternate route.',
    time: '2 hours ago',
    read: true,
  },
];

// Mock Driver Performance
export interface DriverPerformance {
  totalDeliveries: number;
  onTimeRate: number;
  efficiency: number;
  workloadBalance: number;
}

export const mockDriverPerformance: DriverPerformance = {
  totalDeliveries: 156,
  onTimeRate: 94,
  efficiency: 87,
  workloadBalance: 82,
};

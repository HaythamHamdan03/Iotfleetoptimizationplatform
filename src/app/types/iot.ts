export interface IoTPayload {
  temp: number;
  humidity: number;
  temp_status: 'NORMAL' | 'WARM' | 'TOO HOT';
  motion: 'STOPPED' | 'ACCELERATING' | 'DECELERATING' | 'STEADY';
  gps_status: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  satellites: number;
  gps_fix: boolean;
}

export interface ESP32Response {
  temp_ok: boolean;
  motion_ok: boolean;
  sim_ok: boolean;
  temp_c: number;
  humidity: number;
  temp_status: string;
  motion: string;
  sim_status: string;
}

export interface IoTDeviceState {
  data: IoTPayload | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  consecutiveFailures: number;
}

export interface Disruption {
  id: string;
  type: 'unexpected_stop' | 'gps_signal_lost' | 'temperature_alert' | 'traffic_slowdown';
  detectedAt: Date;
  resolvedAt: Date | null;
  severity: 'low' | 'medium' | 'high';
  vehicleId: string;
  description: string;
}

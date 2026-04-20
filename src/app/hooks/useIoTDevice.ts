import { useState, useEffect, useRef } from 'react';
import { IOT_CONFIG } from '@/app/config/iotConfig';
import { generateMockIoTPayload } from '@/app/simulation/mockIoTDevice';
import type { IoTPayload, ESP32Response, IoTDeviceState } from '@/app/types/iot';
import { fetchIoTDeviceData } from '@/app/services/api';

const BASE_LAT = 24.774265;
const BASE_LON = 46.738586;

function mapESP32(raw: ESP32Response, tick: number): IoTPayload {
  const lat = BASE_LAT + 0.0002 * Math.sin(tick * 0.1) * tick * 0.01;
  const lon = BASE_LON + 0.0002 * Math.cos(tick * 0.1) * tick * 0.01;

  const tempStatus: IoTPayload['temp_status'] =
    raw.temp_status === 'TOO HOT' ? 'TOO HOT' :
    raw.temp_status === 'WARM'    ? 'WARM'    : 'NORMAL';

  const motion: IoTPayload['motion'] =
    raw.motion === 'ACCELERATING' ? 'ACCELERATING' :
    raw.motion === 'DECELERATING' ? 'DECELERATING' :
    raw.motion === 'STEADY'       ? 'STEADY'       : 'STOPPED';

  const speed =
    motion === 'STOPPED'      ? 0 :
    motion === 'STEADY'       ? 45 :
    motion === 'ACCELERATING' ? Math.min(100, 40 + tick % 30) :
    /* DECELERATING */          Math.max(10, 70 - tick % 30);

  return {
    temp: raw.temp_ok ? raw.temp_c : 0,
    humidity: raw.temp_ok ? raw.humidity : 0,
    temp_status: tempStatus,
    motion,
    gps_status: 'SIMULATED',
    lat,
    lon,
    altitude: 620,
    speed: Math.round(speed * 10) / 10,
    satellites: 12,
    gps_fix: true,
  };
}

export function useIoTDevice(): IoTDeviceState {
  const [state, setState] = useState<IoTDeviceState>({
    data: null,
    isConnected: false,
    lastUpdated: null,
    error: null,
    consecutiveFailures: 0,
  });

  const tickRef = useRef(0);
  const failuresRef = useRef(0);
  const lastDataRef = useRef<IoTPayload | null>(null);

  useEffect(() => {
    if (IOT_CONFIG.USE_MOCK) {
      const interval = setInterval(() => {
        tickRef.current += 1;
        const data = generateMockIoTPayload(tickRef.current);
        lastDataRef.current = data;
        setState({
          data,
          isConnected: true,
          lastUpdated: new Date(),
          error: null,
          consecutiveFailures: 0,
        });
      }, IOT_CONFIG.POLL_INTERVAL);

      return () => clearInterval(interval);
    }

    // Real device — fetch through Vite proxy (/iot-device) to avoid mixed-content blocks
    const interval = setInterval(async () => {
      try {
        const raw: ESP32Response = await fetchIoTDeviceData();
        tickRef.current += 1;
        const data = mapESP32(raw, tickRef.current);
        lastDataRef.current = data;
        failuresRef.current = 0;
        setState({
          data,
          isConnected: true,
          lastUpdated: new Date(),
          error: null,
          consecutiveFailures: 0,
        });
      } catch (err) {
        failuresRef.current += 1;
        const failures = failuresRef.current;
        const offline = failures >= IOT_CONFIG.FAILURE_THRESHOLD;
        setState(prev => ({
          ...prev,
          data: lastDataRef.current,
          isConnected: offline ? false : prev.isConnected,
          error: offline ? 'Device offline' : prev.error,
          consecutiveFailures: failures,
        }));
      }
    }, IOT_CONFIG.POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return state;
}

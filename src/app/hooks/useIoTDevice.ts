import { useState, useEffect, useRef } from 'react';
import { IOT_CONFIG } from '@/app/config/iotConfig';
import { generateMockIoTPayload, IoTPayload } from '@/app/simulation/mockIoTDevice';

interface IoTDeviceState {
  data: IoTPayload | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  consecutiveFailures: number;
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

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${IOT_CONFIG.DEVICE_URL}/data`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: IoTPayload = await res.json();
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

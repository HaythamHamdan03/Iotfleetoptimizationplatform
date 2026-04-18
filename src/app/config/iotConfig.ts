export const IOT_CONFIG = {
  // ─── TOGGLE THIS to switch between mock and real device ───
  USE_MOCK: true,

  // Real device URL (change this to your device's IP when ready)
  DEVICE_URL: 'http://192.168.1.47',

  // How often to poll in milliseconds
  POLL_INTERVAL: 4000,

  // How many failures before marking device as offline
  FAILURE_THRESHOLD: 3,
} as const;

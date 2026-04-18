import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Wifi, WifiOff, Satellite, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Thermometer, Wind, Gauge, MapPin, CheckCircle2, Battery, Truck, Zap, RefreshCw,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { mockVehicles, mockDeliveryStops } from '@/app/data/mockData';
import type { Vehicle, DeliveryStop } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useIoT } from '@/app/context/IoTContext';
import type { Disruption } from '@/app/hooks/useDisruptionDetector';
import { IOT_CONFIG } from '@/app/config/iotConfig';
import {
  fetchStreetRoute,
  fetchAlternateStreetRoute,
  type LatLng,
} from '@/app/utils/streetRouting';
import { renderStopMarkers, buildFinalStopIcon } from '@/app/utils/stopMarkers';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

// SPL Central Post Office — depot / origin for the active driver (Dammam).
const BASE_LAT = 26.4352;
const BASE_LON = 50.1082;

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function formatDisruptionType(type: Disruption['type']): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

const vehicleColor = (status: Vehicle['status']) =>
  status === 'on-route' ? '#16a34a' : status === 'delayed' ? '#dc2626' : '#6b7280';

// Muted palette for other vehicles' planned routes (distinct from blue/amber).
const ROUTE_COLORS: Record<string, string> = {
  V001: '#64748b', // slate
  V003: '#0d9488', // teal
  V004: '#a3a847', // olive
  V005: '#8b5cf6', // purple
  V006: '#6b7280', // gray
};

// Active driver (V002 / EV-02) — the stops for the blue/amber live polyline.
const activeVehicle = mockVehicles.find(v => v.id === 'V002');
const activeRouteStops: DeliveryStop[] = (activeVehicle?.routeStopIds ?? [])
  .map(id => mockDeliveryStops.find(s => s.id === id))
  .filter((s): s is DeliveryStop => !!s);
const activeFinalStopId = activeRouteStops[activeRouteStops.length - 1]?.id;

function stopsForVehicle(v: Vehicle): DeliveryStop[] {
  return v.routeStopIds
    .map(id => mockDeliveryStops.find(s => s.id === id))
    .filter((s): s is DeliveryStop => !!s);
}

export function LiveFleetMapPage() {
  const { t, isRTL } = useLanguage();
  const {
    iotData: data,
    isConnected,
    lastUpdated,
    consecutiveFailures,
    disruptions,
    isRecalculating,
    recalcTimeMs,
    systemReliability,
    acknowledgeDisruption,
    hasRecalculated,
    setHasRecalculated,
    manualRecalcTick,
    triggerManualRecalc,
  } = useIoT();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const ev02MarkerRef = useRef<L.CircleMarker | null>(null);
  const mockMarkerRefs = useRef<Map<string, L.CircleMarker>>(new Map());
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const prevActivePathRef = useRef<LatLng[] | null>(null);
  const finalStopMarkerRef = useRef<L.Marker | null>(null);
  const vehicleRouteLayersRef = useRef<Map<string, L.Polyline>>(new Map());
  const prevIsRecalcRef = useRef(false);
  const prevManualRecalcTickRef = useRef(manualRecalcTick);
  const routingTokenRef = useRef(0);

  const [logOpen, setLogOpen] = useState(true);
  const [deviceIpEdit, setDeviceIpEdit] = useState(false);
  const [deviceIp, setDeviceIp] = useState(IOT_CONFIG.DEVICE_URL.replace('http://', ''));
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const unresolvedDisruptions = disruptions.filter((d: Disruption) => d.resolvedAt === null);
  const selectedVehicle = selectedVehicleId === 'EV-02'
    ? null
    : mockVehicles.find(v => v.id === selectedVehicleId) ?? null;

  const panTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.setView([lat, lng], 14, { animate: true });
  }, []);

  const selectVehicle = useCallback((id: string, lat: number, lng: number) => {
    setSelectedVehicleId(id);
    panTo(lat, lng);
  }, [panTo]);

  // Compute a street-following route from (lat,lon) through the active driver's stops,
  // then replace the polyline. `asRecalc=false` -> initial blue solid; `true` -> amber
  // dashed route that meaningfully diverges from the previous path.
  const computeRoute = useCallback(async (lat: number, lon: number, asRecalc: boolean) => {
    if (!mapRef.current) return;
    const token = ++routingTokenRef.current;
    setIsRouting(true);
    const waypoints: LatLng[] = [
      [lat, lon],
      ...activeRouteStops.map(s => [s.lat, s.lng] as LatLng),
    ];

    const path = asRecalc
      ? await fetchAlternateStreetRoute(waypoints, prevActivePathRef.current, 5)
      : await fetchStreetRoute(waypoints);

    if (token !== routingTokenRef.current || !mapRef.current) {
      setIsRouting(false);
      return;
    }

    const previous = routePolylineRef.current;
    if (previous) {
      previous.setStyle({ opacity: 0 });
      setTimeout(() => {
        previous.remove();
      }, 500);
    }

    const baseOpts: L.PolylineOptions = asRecalc
      ? {
          color: '#f59e0b',
          weight: 5,
          opacity: 0.95,
          dashArray: '10 8',
          className: 'route-polyline route-recalc',
        }
      : {
          color: '#2563eb',
          weight: 4,
          opacity: 0.9,
          className: 'route-polyline route-initial',
        };

    routePolylineRef.current = L.polyline(path, {
      ...baseOpts,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(mapRef.current);

    prevActivePathRef.current = path;

    if (asRecalc) setHasRecalculated(true);
    setIsRouting(false);
  }, [setHasRecalculated]);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: true })
      .setView([BASE_LAT, BASE_LON], 12);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Render every delivery stop with the proper visual hierarchy
    const { finalMarker } = renderStopMarkers(
      map,
      mockDeliveryStops,
      t('fleet.finalStop'),
      activeFinalStopId
    );
    finalStopMarkerRef.current = finalMarker;

    // Compute and draw each non-active vehicle's planned route in a muted color
    mockVehicles.filter(v => v.id !== 'V002').forEach(v => {
      const stops = stopsForVehicle(v);
      if (stops.length < 1) return;
      const waypoints: LatLng[] = [
        [v.lat, v.lng],
        ...stops.map(s => [s.lat, s.lng] as LatLng),
      ];
      fetchStreetRoute(waypoints).then(path => {
        if (!mapRef.current) return;
        const polyline = L.polyline(path, {
          color: ROUTE_COLORS[v.id] ?? '#6b7280',
          weight: 3,
          opacity: 0.45,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(mapRef.current);
        polyline.bringToBack();
        vehicleRouteLayersRef.current.set(v.id, polyline);
      });
    });

    // Compute the active driver's initial street-following route (blue solid)
    computeRoute(BASE_LAT, BASE_LON, false);

    // Static mock vehicle markers (excluding EV-02)
    mockVehicles.filter(v => v.id !== 'V002').forEach(v => {
      const m = L.circleMarker([v.lat, v.lng], {
        radius: 9,
        fillColor: vehicleColor(v.status),
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map).bindPopup(`<b>${v.name}</b><br>${v.driverName}<br>${v.status}`);
      m.on('click', () => selectVehicle(v.id, v.lat, v.lng));
      mockMarkerRefs.current.set(v.id, m);
    });

    // EV-02 live marker
    const ev02 = L.circleMarker([BASE_LAT, BASE_LON], {
      radius: 14,
      fillColor: '#2563eb',
      color: '#1d4ed8',
      weight: 3,
      fillOpacity: 0.9,
    }).addTo(map);
    ev02.bindPopup(t('fleet.vehicleLoading'));
    ev02.on('click', () => setSelectedVehicleId('EV-02'));
    ev02MarkerRef.current = ev02;

    return () => {
      map.remove();
      mapRef.current = null;
      ev02MarkerRef.current = null;
      routePolylineRef.current = null;
      finalStopMarkerRef.current = null;
      mockMarkerRefs.current.clear();
      vehicleRouteLayersRef.current.clear();
    };
    // t intentionally not in deps: language changes update the icon via a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectVehicle, computeRoute]);

  // Highlight the selected vehicle's planned-route polyline
  useEffect(() => {
    vehicleRouteLayersRef.current.forEach((polyline, vehicleId) => {
      const isSelected = vehicleId === selectedVehicleId;
      polyline.setStyle({
        opacity: isSelected ? 0.9 : 0.4,
        weight: isSelected ? 5 : 3,
      });
      if (isSelected) polyline.bringToFront();
    });
  }, [selectedVehicleId]);

  // Update final-stop marker label when language changes
  useEffect(() => {
    finalStopMarkerRef.current?.setIcon(buildFinalStopIcon(t('fleet.finalStop')));
  }, [t]);

  // Update EV-02 marker as vehicle moves (route is recomputed only on recalc, not per tick)
  useEffect(() => {
    if (!data?.gps_fix) return;
    if (ev02MarkerRef.current) {
      ev02MarkerRef.current.setLatLng([data.lat, data.lon]);
      ev02MarkerRef.current.setPopupContent(
        `EV-02 | ${data.speed.toFixed(1)} km/h | ${data.motion} | ${data.temp.toFixed(1)}°C`
      );
    }
  }, [data]);

  // When automatic recalculation completes, redraw as the amber dashed "recalculated" route
  useEffect(() => {
    const wasRecalculating = prevIsRecalcRef.current;
    prevIsRecalcRef.current = isRecalculating;
    if (!wasRecalculating || isRecalculating) return;

    const lat = data?.lat ?? BASE_LAT;
    const lon = data?.lon ?? BASE_LON;
    computeRoute(lat, lon, true);
  }, [isRecalculating, data, computeRoute]);

  // React to manual recalc triggered from any view
  useEffect(() => {
    if (manualRecalcTick === prevManualRecalcTickRef.current) return;
    prevManualRecalcTickRef.current = manualRecalcTick;
    const lat = data?.lat ?? BASE_LAT;
    const lon = data?.lon ?? BASE_LON;
    computeRoute(lat, lon, true);
  }, [manualRecalcTick, data, computeRoute]);

  const handleManualRecalc = () => {
    triggerManualRecalc();
  };

  const reliabilityColor =
    systemReliability >= 97 ? 'bg-green-100 text-green-700' :
    systemReliability >= 93 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  const severityBadge = (s: Disruption['severity']) =>
    s === 'high' ? 'bg-red-100 text-red-700' :
    s === 'medium' ? 'bg-amber-100 text-amber-700' :
    'bg-blue-100 text-blue-700';

  const tempBadge = (status: string) =>
    status === 'TOO HOT' ? 'bg-red-100 text-red-700' :
    status === 'WARM' ? 'bg-amber-100 text-amber-700' :
    'bg-green-100 text-green-700';

  return (
    <div className={`h-full flex flex-col ${isRTL ? 'direction-rtl' : ''}`}>

      {/* STATUS BAR */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-700">{t('iot.connected')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">{t('iot.offline')}</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300" />
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${reliabilityColor}`}>
          {t('iot.reliability')}: {systemReliability.toFixed(1)}%
        </span>

        {recalcTimeMs !== null && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <span className="text-xs text-gray-600">
              {t('iot.recalcLast')}: {(recalcTimeMs / 1000).toFixed(1)}s
            </span>
          </>
        )}

        {unresolvedDisruptions.length > 0 && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
              ⚠ {unresolvedDisruptions.length} {t('iot.disruption')}
            </span>
          </>
        )}

        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Satellite className="w-3.5 h-3.5" />
          <span>{data?.satellites ?? '—'} sats</span>
        </div>

        <button
          onClick={() => data && panTo(data.lat, data.lon)}
          className="ml-2 px-2 py-1 text-xs bg-amber-50 border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors flex items-center gap-1"
        >
          <Zap className="w-3 h-3" /> Track EV-02
        </button>

        <button
          onClick={handleManualRecalc}
          disabled={isRouting}
          className="px-2 py-1 text-xs bg-blue-50 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          title={t('fleet.recalculate')}
        >
          <RefreshCw className={`w-3 h-3 ${isRouting ? 'animate-spin' : ''}`} />
          {isRouting ? t('fleet.routing') : t('fleet.recalculate')}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {deviceIpEdit ? (
            <input
              className="text-xs border border-gray-300 rounded px-2 py-0.5 w-36 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={deviceIp}
              onChange={e => setDeviceIp(e.target.value)}
              onBlur={() => setDeviceIpEdit(false)}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setDeviceIpEdit(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              <Settings className="w-3.5 h-3.5" />
              {t('iot.deviceConfig')}: {deviceIp}
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex flex-1 min-h-0 ${isRTL ? 'flex-row-reverse' : ''}`}>

        {/* MAP — isolate contains Leaflet z-indexes */}
        <div className="flex-1 relative isolate" role="application" aria-label={t('fleet.mapAriaLabel')}>
          <div ref={mapContainerRef} className="absolute inset-0" />

          {isRecalculating && (
            <div
              className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse flex items-center gap-2"
              style={{ zIndex: 1000 }}
            >
              ⚡ {t('iot.recalculating')}
            </div>
          )}

          {/* Route legend (bottom-left) */}
          <div
            className="absolute bottom-2 left-2 bg-white/95 backdrop-blur border border-gray-200 shadow-md rounded-md px-2.5 py-1.5 text-[10px] text-gray-700"
            style={{ zIndex: 1000 }}
          >
            <div className="font-semibold text-gray-900 mb-1">{t('fleet.legend.title')}</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
                <line x1="0" y1="3" x2="22" y2="3" stroke="hsl(var(--chart-1))" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className={hasRecalculated ? 'text-gray-400' : ''}>{t('fleet.legend.original')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
                <line x1="0" y1="3" x2="22" y2="3" stroke="hsl(var(--chart-4))" strokeWidth="4" strokeDasharray="4 3" strokeLinecap="round" />
              </svg>
              <span className={hasRecalculated ? 'font-semibold text-amber-700' : ''}>{t('fleet.legend.recalc')}</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR TOGGLE — anchored on the inner edge of the sidebar */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label={sidebarOpen ? t('fleet.collapseSidebar') : t('fleet.expandSidebar')}
          aria-expanded={sidebarOpen}
          className={`self-center z-10 h-10 w-6 rounded-none border-y border-gray-200 bg-white hover:bg-muted transition-colors duration-150 ${isRTL ? 'border-l-0 border-r' : 'border-r-0 border-l'}`}
        >
          {sidebarOpen
            ? (isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
            : (isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
        </Button>

        {/* RIGHT SIDEBAR */}
        <div
          className={`bg-white overflow-y-auto flex-shrink-0 ${isRTL ? 'border-r' : 'border-l'} border-gray-200 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-0'
          }`}
          aria-hidden={!sidebarOpen}
        >

          {/* Selected vehicle detail */}
          {selectedVehicleId && (
            <div className="p-4 border-b border-blue-100 bg-blue-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-900">
                  {selectedVehicleId === 'EV-02' ? 'EV-02 — Live' : selectedVehicle?.name}
                </h3>
                <button onClick={() => setSelectedVehicleId(null)} className="text-xs text-blue-400 hover:text-blue-600">✕</button>
              </div>

              {selectedVehicleId === 'EV-02' && data ? (
                <div className="space-y-1 text-xs text-blue-900">
                  <p><span className="text-blue-500">Driver:</span> Mohammed Al-Saud</p>
                  <p><span className="text-blue-500">Speed:</span> {data.speed.toFixed(1)} km/h</p>
                  <p><span className="text-blue-500">Motion:</span> {data.motion}</p>
                  <p>
                    <span className="text-blue-500">Temp:</span> {data.temp.toFixed(1)}°C
                    <span className={`ml-1 px-1 rounded text-xs font-semibold ${tempBadge(data.temp_status)}`}>{data.temp_status}</span>
                  </p>
                  <p><span className="text-blue-500">Humidity:</span> {data.humidity.toFixed(1)}%</p>
                  <p><span className="text-blue-500">Altitude:</span> {data.altitude.toFixed(1)} m</p>
                  <p><span className="text-blue-500">GPS:</span> {data.gps_status} · {data.satellites} sats</p>
                  <p><span className="text-blue-500">Coords:</span> {data.lat.toFixed(5)}, {data.lon.toFixed(5)}</p>
                </div>
              ) : selectedVehicle ? (
                <div className="space-y-1 text-xs text-blue-900">
                  <p><span className="text-blue-500">Driver:</span> {selectedVehicle.driverName}</p>
                  <p><span className="text-blue-500">Status:</span> {selectedVehicle.status}</p>
                  <p><span className="text-blue-500">Coords:</span> {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</p>
                  {selectedVehicle.type === 'ev'
                    ? <p><span className="text-blue-500">Battery:</span> {selectedVehicle.batteryLevel}%</p>
                    : <p><span className="text-blue-500">Fuel:</span> {selectedVehicle.fuelLevel}%</p>}
                  <p><span className="text-blue-500">Load:</span> {selectedVehicle.currentLoad}/{selectedVehicle.maxLoad} kg</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Live IoT Feed */}
          <div className="p-4 border-b border-gray-100">
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Wifi className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">{t('iot.liveData')}</h3>
            </div>

            {!isConnected && consecutiveFailures > 0 && (
              <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                ⚠ {t('iot.lastKnown')}
              </div>
            )}

            {data ? (
              <div className="space-y-3">
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-gray-900">{data.speed.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">km/h</p>
                </div>
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600 flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />{t('iot.motion')}</span>
                  <span className="font-medium text-gray-900">{data.motion}</span>
                </div>
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600 flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" />{t('iot.temperature')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{data.temp.toFixed(1)}°C</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${tempBadge(data.temp_status)}`}>{data.temp_status}</span>
                  </div>
                </div>
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600 flex items-center gap-1"><Wind className="w-3.5 h-3.5" />{t('iot.humidity')}</span>
                  <span className="font-medium">{data.humidity.toFixed(1)}%</span>
                </div>
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t('iot.satellites')}</span>
                  <span className="font-medium">{data.gps_status} · {data.satellites} sats</span>
                </div>
                <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{t('iot.altitude')}</span>
                  <span className="font-medium">{data.altitude.toFixed(1)} m</span>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 text-center pt-1">{lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Waiting for data...</p>
            )}
          </div>

          {/* Fleet Vehicles */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('home.fleetStatus')}</h3>
            <p className="text-xs text-gray-400 mb-3">{t('fleet.clickVehicleHint')}</p>
            {mockVehicles.length === 0 && !data && (
              <div className="space-y-2" aria-hidden="true">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            <div className="space-y-2">

              <button
                onClick={() => data && selectVehicle('EV-02', data.lat, data.lon)}
                aria-label="EV-02 live vehicle"
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  selectedVehicleId === 'EV-02' ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-blue-50/50 hover:border-blue-400'
                }`}
              >
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Battery className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900 truncate" title="EV-02">EV-02</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">● {t('iot.liveIndicator')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Mohammed Al-Saud</p>
                {data && <p className="text-xs text-blue-600 mt-0.5">{data.speed.toFixed(1)} km/h · {data.motion}</p>}
              </button>

              {mockVehicles.filter(v => v.id !== 'V002').map(v => {
                const isDelayed = v.status === 'delayed';
                const matchedDisruption = disruptions.find(
                  (d: Disruption) => d.vehicleId !== 'EV-02' && d.resolvedAt === null
                );
                const statusLabel = v.status === 'on-route' ? t('fleet.onRoute')
                  : v.status === 'delayed' ? t('fleet.delayed') : t('fleet.idle');
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVehicle(v.id, v.lat, v.lng)}
                    aria-label={`${v.name} — ${statusLabel}`}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      selectedVehicleId === v.id ? 'border-blue-500 bg-blue-50' :
                      isDelayed ? 'border-red-200 bg-red-50 hover:border-red-400' :
                      'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {v.type === 'ev'
                          ? <Battery className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                          : <Truck className="w-4 h-4 text-gray-600 flex-shrink-0" aria-hidden="true" />}
                        <span className="text-sm font-medium text-gray-900 truncate" title={v.name}>{v.name}</span>
                        {isDelayed && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 flex-shrink-0">{t('fleet.disrupted')}</span>
                        )}
                      </div>
                      {isDelayed && matchedDisruption && (
                        <button
                          onClick={e => { e.stopPropagation(); acknowledgeDisruption(matchedDisruption.id); }}
                          aria-label={t('iot.resolve')}
                          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />{t('iot.resolve')}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.driverName}</p>
                    <p className={`text-xs mt-0.5 font-medium ${
                      v.status === 'on-route' ? 'text-green-600' :
                      v.status === 'delayed' ? 'text-red-600' : 'text-gray-500'
                    }`}>● {statusLabel}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DISRUPTION LOG */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <button
          onClick={() => setLogOpen(o => !o)}
          className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{t('fleet.disruptionLog')}</span>
            {unresolvedDisruptions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                {unresolvedDisruptions.length}
              </span>
            )}
          </div>
          {logOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </button>

        {logOpen && (
          <div className="px-4 pb-3 max-h-48 overflow-y-auto">
            {disruptions.length === 0 ? (
              <p className="text-sm text-green-600 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ✓ {t('iot.noDisruptions')}
              </p>
            ) : (
              <div className="space-y-2">
                {disruptions.map((d: Disruption) => (
                  <div key={d.id} className={`flex items-start gap-3 py-2 border-b border-gray-100 last:border-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${severityBadge(d.severity)}`}>
                      {d.severity.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 ${d.resolvedAt ? 'line-through text-gray-400' : ''}`}>
                        {formatDisruptionType(d.type)}
                      </p>
                      <p className="text-xs text-gray-500">{d.description}</p>
                      <p className="text-xs text-gray-400">{timeAgo(d.detectedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {d.resolvedAt ? (
                        <span className="text-xs text-green-600 font-medium">✓ Resolved</span>
                      ) : (
                        <>
                          <span className="text-xs text-red-500 font-medium">● Active</span>
                          <button
                            onClick={() => acknowledgeDisruption(d.id)}
                            className="text-xs text-gray-400 hover:text-green-600 underline"
                          >
                            {t('iot.resolve')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, CheckCircle2, Clock, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { mockDeliveryStops, mockVehicles, type DeliveryStop } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useIoT } from '@/app/context/IoTContext';
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

// Active driver (V002) — the stops to route through from the driver's current GPS.
const driverVehicle = mockVehicles.find(v => v.id === 'V002');
const driverRouteStops: DeliveryStop[] = (driverVehicle?.routeStopIds ?? [])
  .map(id => mockDeliveryStops.find(s => s.id === id))
  .filter((s): s is DeliveryStop => !!s);

function motionArrow(motion: string): string {
  if (motion === 'ACCELERATING') return '↑';
  if (motion === 'DECELERATING') return '↓';
  if (motion === 'STOPPED') return '■';
  return '→';
}

export function RouteNavigationPage() {
  const { t, isRTL } = useLanguage();
  const {
    iotData: data,
    isConnected,
    isRecalculating,
    recalcTimeMs,
    currentStopIndex,
    setCurrentStopIndex,
    hasRecalculated,
    setHasRecalculated,
    manualRecalcTick,
    triggerManualRecalc,
  } = useIoT();

  const [isRouting, setIsRouting] = useState(false);
  const currentStop = mockDeliveryStops[currentStopIndex];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.CircleMarker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const prevPathRef = useRef<LatLng[] | null>(null);
  const finalStopMarkerRef = useRef<L.Marker | null>(null);
  const prevLatLonRef = useRef<[number, number] | null>(null);
  const prevIsRecalcRef = useRef(false);
  const prevManualRecalcTickRef = useRef(manualRecalcTick);
  const routingTokenRef = useRef(0);

  // Compute a street-following route from (lat,lon) through all remaining stops,
  // then replace the polyline. `asRecalc=false` -> initial blue solid; `true` -> amber
  // dashed route that meaningfully diverges from the previous path.
  const computeRoute = useCallback(async (lat: number, lon: number, asRecalc: boolean) => {
    if (!mapRef.current) return;
    const token = ++routingTokenRef.current;
    setIsRouting(true);
    const remaining = driverRouteStops.filter(s => s.status !== 'completed');
    const waypoints: LatLng[] = [[lat, lon], ...remaining.map(s => [s.lat, s.lng] as LatLng)];

    const path = asRecalc
      ? await fetchAlternateStreetRoute(waypoints, prevPathRef.current, 5)
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

    prevPathRef.current = path;

    if (asRecalc) setHasRecalculated(true);
    setIsRouting(false);
  }, [setHasRecalculated]);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false })
      .setView([BASE_LAT, BASE_LON], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Render every delivery stop with the proper visual hierarchy
    const { finalMarker } = renderStopMarkers(
      map,
      mockDeliveryStops,
      t('fleet.finalStop')
    );
    finalStopMarkerRef.current = finalMarker;

    // Vehicle marker
    const marker = L.circleMarker([BASE_LAT, BASE_LON], {
      radius: 12,
      fillColor: '#2563eb',
      color: '#1d4ed8',
      weight: 3,
      fillOpacity: 0.95,
    }).addTo(map);
    marker.bindPopup('EV-02');
    vehicleMarkerRef.current = marker;

    // Compute initial street-following route (blue solid)
    computeRoute(BASE_LAT, BASE_LON, false);

    return () => {
      map.remove();
      mapRef.current = null;
      vehicleMarkerRef.current = null;
      routePolylineRef.current = null;
      finalStopMarkerRef.current = null;
    };
    // t intentionally not in deps: language changes update the icon via a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeRoute]);

  // Update final-stop marker label when language changes
  useEffect(() => {
    finalStopMarkerRef.current?.setIcon(buildFinalStopIcon(t('fleet.finalStop')));
  }, [t]);

  // Follow vehicle — update marker + recenter (don't refetch route on every tick)
  useEffect(() => {
    if (!data?.gps_fix || !mapRef.current || !vehicleMarkerRef.current) return;
    const pos: [number, number] = [data.lat, data.lon];
    const prev = prevLatLonRef.current;
    if (prev && prev[0] === pos[0] && prev[1] === pos[1]) return;
    prevLatLonRef.current = pos;
    vehicleMarkerRef.current.setLatLng(pos);
    mapRef.current.setView(pos, undefined, { animate: true });
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

  const speedColor = !data ? 'text-gray-500' :
    data.speed > 90 ? 'text-red-600' :
    data.speed >= 60 ? 'text-amber-600' : 'text-green-600';

  const tempBadge = !data ? '' :
    data.temp_status === 'TOO HOT' ? 'bg-red-100 text-red-700' :
    data.temp_status === 'WARM' ? 'bg-amber-100 text-amber-700' :
    'bg-green-100 text-green-700';

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return t('nav2.completed');
    if (status === 'current') return t('nav2.current');
    return t('nav2.upcoming');
  };

  return (
    <div className="h-full flex flex-col">

      {/* MAP */}
      <div className="relative isolate flex-shrink-0" style={{ height: '240px' }}>
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Recalculate button overlay */}
        <button
          onClick={handleManualRecalc}
          disabled={isRouting}
          className="absolute top-3 right-3 bg-white text-blue-700 border border-blue-200 shadow-md rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          style={{ zIndex: 1000 }}
          title={t('fleet.recalculate')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRouting ? 'animate-spin' : ''}`} />
          {isRouting ? t('fleet.routing') : t('fleet.recalculate')}
        </button>

        {/* Route legend (bottom-left) */}
        <div
          className="absolute bottom-2 left-2 bg-white/95 backdrop-blur border border-gray-200 shadow-md rounded-md px-2.5 py-1.5 text-[10px] text-gray-700"
          style={{ zIndex: 1000 }}
        >
          <div className="font-semibold text-gray-900 mb-1">{t('fleet.legend.title')}</div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
              <line x1="0" y1="3" x2="22" y2="3" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className={hasRecalculated ? 'text-gray-400' : ''}>{t('fleet.legend.original')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
              <line x1="0" y1="3" x2="22" y2="3" stroke="#f59e0b" strokeWidth="4" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>
            <span className={hasRecalculated ? 'font-semibold text-amber-700' : ''}>{t('fleet.legend.recalc')}</span>
          </div>
        </div>
      </div>

      {/* LIVE STATS BAR */}
      {data && (
        <div className={`flex items-center gap-3 px-3 py-2 bg-gray-900 text-white text-xs flex-shrink-0 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="flex items-center gap-1 font-bold text-green-400">● {t('iot.liveIndicator')}</span>
          <span className="text-gray-400">|</span>
          <span className={`font-semibold ${speedColor}`}>{data.speed.toFixed(1)} km/h</span>
          <span className="text-gray-400">|</span>
          <span className="font-medium">{motionArrow(data.motion)} {data.motion}</span>
          <span className="text-gray-400">|</span>
          <span className="flex items-center gap-1">
            {data.temp.toFixed(1)}°C
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${tempBadge}`}>{data.temp_status}</span>
          </span>
          <span className="text-gray-400">|</span>
          <span>🛰 {data.satellites}</span>
        </div>
      )}

      {/* DISRUPTION BANNER */}
      {isRecalculating && (
        <div className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex-shrink-0 flex items-center gap-2">
          ⚡ {t('iot.recalculating')}
          {recalcTimeMs !== null && (
            <span className="text-amber-100 text-xs">{t('iot.recalcLast')}: {(recalcTimeMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      )}

      {/* OFFLINE BANNER */}
      {!isConnected && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 text-xs text-gray-600 flex-shrink-0">
          📡 {t('iot.lastKnown')}
        </div>
      )}

      {/* Stop Details Panel */}
      {currentStop && (
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-blue-700" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="font-semibold text-gray-900 mb-1">{currentStop.address}</h3>
              <div className={`flex items-center gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {currentStop.packageCount !== undefined && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package className="w-4 h-4" />
                    <span>{currentStop.packageCount} {t('nav2.packages')}</span>
                  </div>
                )}
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-4 h-4" />
                  <span>{t('nav2.eta')}: {currentStop.scheduledTime}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <button className={`w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CheckCircle2 className="w-5 h-5" />
              {t('nav2.markDelivered')}
            </button>
            <button className={`w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="w-5 h-5" />
              Report Delay
            </button>
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="bg-white border-t border-gray-200 flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className={`text-sm font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>
            {t('driver.stops')} ({mockDeliveryStops.length})
          </h3>
          <div className="space-y-2">
            {mockDeliveryStops.map((stop, index) => (
              <button key={stop.id} onClick={() => setCurrentStopIndex(index)}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors ${index === currentStopIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                    stop.status === 'completed' ? 'bg-green-500 text-white'
                    : stop.status === 'current' ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                  }`}>
                    {stop.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium text-gray-900 truncate">{stop.address}</p>
                    <p className="text-xs text-gray-600">
                      {stop.packageCount !== undefined && `${stop.packageCount} ${t('nav2.packages')} · `}
                      {stop.scheduledTime}
                    </p>
                  </div>
                  {stop.status === 'current' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {getStatusLabel(stop.status)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

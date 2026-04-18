import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, CheckCircle2, Clock, AlertTriangle, Package } from 'lucide-react';
import { mockDeliveryStops } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useIoTDevice } from '@/app/hooks/useIoTDevice';
import { useDisruptionDetector } from '@/app/hooks/useDisruptionDetector';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const BASE_LAT = 24.774265;
const BASE_LON = 46.738586;

function motionArrow(motion: string): string {
  if (motion === 'ACCELERATING') return '↑';
  if (motion === 'DECELERATING') return '↓';
  if (motion === 'STOPPED') return '■';
  return '→';
}

export function RouteNavigationPage() {
  const { t, isRTL } = useLanguage();
  const { data, isConnected } = useIoTDevice();
  const { isRecalculating, recalcTimeMs } = useDisruptionDetector(data);

  const [selectedStop, setSelectedStop] = useState<string | null>(
    mockDeliveryStops.find(s => s.status === 'current')?.id ?? null
  );
  const currentStop = mockDeliveryStops.find(s => s.id === selectedStop);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.CircleMarker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const prevLatLonRef = useRef<[number, number] | null>(null);
  const recalcCountRef = useRef(0);
  const prevIsRecalcRef = useRef(false);

  // Draw or update the route polyline (vehicle → remaining stops)
  const drawRoute = useCallback((lat: number, lon: number, color = '#2563eb', offset = 0) => {
    if (!mapRef.current) return;
    const sign = recalcCountRef.current % 2 === 0 ? 1 : -1;
    const remaining = mockDeliveryStops.filter(s => s.status !== 'completed');
    const points: L.LatLngExpression[] = [
      [lat, lon],
      ...remaining.map((s, i) => [
        s.lat + (i > 0 ? sign * offset : 0),
        s.lng + (i > 0 ? sign * offset * 0.6 : 0),
      ] as L.LatLngExpression),
    ];

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(points);
      routePolylineRef.current.setStyle({ color, weight: color === '#f59e0b' ? 4 : 3 });
    } else {
      routePolylineRef.current = L.polyline(points, {
        color,
        weight: 3,
        opacity: 0.85,
      }).addTo(mapRef.current!).bringToBack();
    }
  }, []);

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

    // Draw initial route line
    const remaining = mockDeliveryStops.filter(s => s.status !== 'completed');
    const initialPoints: L.LatLngExpression[] = [
      [BASE_LAT, BASE_LON],
      ...remaining.map(s => [s.lat, s.lng] as L.LatLngExpression),
    ];
    routePolylineRef.current = L.polyline(initialPoints, {
      color: '#2563eb',
      weight: 3,
      opacity: 0.85,
    }).addTo(map).bringToBack();

    // Stop markers
    mockDeliveryStops.forEach(stop => {
      const isCompleted = stop.status === 'completed';
      const isCurrent = stop.status === 'current';
      L.circleMarker([stop.lat, stop.lng], {
        radius: isCompleted ? 6 : isCurrent ? 9 : 7,
        fillColor: isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#9ca3af',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(stop.address, { permanent: false, direction: 'top' });
    });

    // Final destination flag
    const finalStop = remaining[remaining.length - 1];
    if (finalStop) {
      L.circleMarker([finalStop.lat, finalStop.lng], {
        radius: 10,
        fillColor: '#dc2626',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map).bindTooltip('Destination', { permanent: true, direction: 'top' });
    }

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

    return () => {
      map.remove();
      mapRef.current = null;
      vehicleMarkerRef.current = null;
      routePolylineRef.current = null;
    };
  }, []);

  // Follow vehicle — update marker + route + recenter map
  useEffect(() => {
    if (!data?.gps_fix || !mapRef.current || !vehicleMarkerRef.current) return;
    const pos: [number, number] = [data.lat, data.lon];
    const prev = prevLatLonRef.current;
    if (prev && prev[0] === pos[0] && prev[1] === pos[1]) return;
    prevLatLonRef.current = pos;
    vehicleMarkerRef.current.setLatLng(pos);
    mapRef.current.setView(pos, undefined, { animate: true });
    drawRoute(pos[0], pos[1]);
  }, [data, drawRoute]);

  // Flash route amber when recalculation completes, then show updated path
  useEffect(() => {
    const wasRecalculating = prevIsRecalcRef.current;
    prevIsRecalcRef.current = isRecalculating;
    if (!wasRecalculating || isRecalculating) return;

    recalcCountRef.current += 1;
    const lat = data?.lat ?? BASE_LAT;
    const lon = data?.lon ?? BASE_LON;
    const offset = recalcCountRef.current * 0.0003;

    drawRoute(lat, lon, '#f59e0b', offset);
    const timer = setTimeout(() => drawRoute(lat, lon, '#2563eb', offset), 1500);
    return () => clearTimeout(timer);
  }, [isRecalculating, data, drawRoute]);

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
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-4 h-4" />
                  <span>{currentStop.packageCount} {t('nav2.packages')}</span>
                </div>
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-4 h-4" />
                  <span>{t('nav2.eta')}: {currentStop.estimatedTime}</span>
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
              <button key={stop.id} onClick={() => setSelectedStop(stop.id)}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors ${selectedStop === stop.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
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
                    <p className="text-xs text-gray-600">{stop.packageCount} {t('nav2.packages')} · {stop.estimatedTime}</p>
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

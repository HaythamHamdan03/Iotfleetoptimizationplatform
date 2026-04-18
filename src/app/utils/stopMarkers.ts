import L from 'leaflet';
import type { DeliveryStop } from '@/app/data/mockData';

export function buildCompletedStopIcon(): L.DivIcon {
  return L.divIcon({
    className: 'stop-marker stop-completed',
    html: `<div style="display:flex;align-items:center;justify-content:center;background:#9ca3af;color:white;width:22px;height:22px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);font-size:13px;font-weight:700;line-height:1;">✓</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function buildCurrentStopIcon(): L.DivIcon {
  return L.divIcon({
    className: 'stop-marker stop-current',
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(37,99,235,0.45);animation:stopPulse 1.6s ease-out infinite;"></span>
        <span style="position:absolute;inset:8px;background:#2563eb;border-radius:9999px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function buildPendingStopIcon(label: number | string): L.DivIcon {
  return L.divIcon({
    className: 'stop-marker stop-pending',
    html: `<div style="display:flex;align-items:center;justify-content:center;background:white;color:#1f2937;width:26px;height:26px;border-radius:9999px;border:2px solid #6b7280;box-shadow:0 1px 4px rgba(0,0,0,0.25);font-size:12px;font-weight:700;line-height:1;">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function buildFinalStopIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: 'final-stop-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="background:#dc2626;color:white;border-radius:9999px;width:34px;height:34px;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;line-height:1;">★</div>
        <div style="background:#dc2626;color:white;font-size:10px;font-weight:700;letter-spacing:0.5px;padding:2px 8px;border-radius:4px;margin-top:4px;box-shadow:0 1px 4px rgba(0,0,0,0.25);white-space:nowrap;">${label}</div>
      </div>
    `,
    iconSize: [90, 54],
    iconAnchor: [45, 44],
  });
}

function statusLabel(status: DeliveryStop['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'current') return 'In Progress';
  return 'Upcoming';
}

export interface StopMarkerHandles {
  markers: L.Marker[];
  finalMarker: L.Marker | null;
}

/**
 * Render all stops on the map with the visual hierarchy:
 * completed → gray ✓, current → pulsing blue, pending → numbered white, final → red ★.
 * The last non-completed stop (or explicit `finalStopId`) becomes the final marker.
 */
export function renderStopMarkers(
  map: L.Map,
  stops: DeliveryStop[],
  finalStopLabel: string,
  finalStopId?: string
): StopMarkerHandles {
  const resolvedFinalId = finalStopId ?? [...stops].reverse().find(s => s.status !== 'completed')?.id;

  const markers: L.Marker[] = [];
  let finalMarker: L.Marker | null = null;

  stops.forEach((stop, index) => {
    const isFinal = stop.id === resolvedFinalId;
    let icon: L.DivIcon;
    if (isFinal) {
      icon = buildFinalStopIcon(finalStopLabel);
    } else if (stop.status === 'completed') {
      icon = buildCompletedStopIcon();
    } else if (stop.status === 'current') {
      icon = buildCurrentStopIcon();
    } else {
      icon = buildPendingStopIcon(index + 1);
    }

    const marker = L.marker([stop.lat, stop.lng], {
      icon,
      interactive: true,
      keyboard: false,
    })
      .addTo(map)
      .bindTooltip(
        `<b>${stop.address}</b><br><span style="color:#6b7280;font-size:11px;">${statusLabel(stop.status)}</span>`,
        { direction: 'top', offset: [0, -8] }
      );

    if (isFinal) finalMarker = marker;
    markers.push(marker);
  });

  return { markers, finalMarker };
}

/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { FlightSpot } from '../../types';
import { CATEGORY_COLORS } from '../../types';
import type { ContextMenuState } from './FpvMap';
import droneIconUrl from '../../assets/drone-icon.svg';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const iconCache = new Map<string, L.DivIcon | L.Icon>();

function makeIcon(category: string | undefined): L.DivIcon | L.Icon {
  const key = category ?? '';
  const cached = iconCache.get(key);
  if (cached) return cached;

  const colour = category ? CATEGORY_COLORS[category] : undefined;
  if (!colour) {
    const icon = L.icon({
      iconUrl: droneIconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      shadowUrl: markerShadowUrl,
      shadowSize: [32, 32],
      shadowAnchor: [16, 16],
    });
    iconCache.set(key, icon);
    return icon;
  }

  // Dot-on-disc divIcon — readable category cue without per-category SVG assets.
  const html = `
    <div style="
      width:28px;height:28px;border-radius:50%;
      background:${colour};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;">
      <img src="${droneIconUrl}" width="18" height="18" style="filter:brightness(0) invert(1);" alt="" />
    </div>`;
  const icon = L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  iconCache.set(key, icon);
  return icon;
}

interface SpotMarkerProps {
  spot: FlightSpot;
  onContextMenu: (state: ContextMenuState) => void;
  longPressActiveRef: React.RefObject<boolean>;
  markerRefs?: React.MutableRefObject<Record<string, L.Marker>>;
}

export function SpotMarker({ spot, onContextMenu, longPressActiveRef, markerRefs }: SpotMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el && spot.id) el.dataset.spotId = spot.id;
  }, [spot.id]);

  // Register marker in parent's ref map for imperative flyTo access
  useEffect(() => {
    if (markerRefs && spot.id && markerRef.current) {
      const refs = markerRefs.current;
      const spotId = spot.id as string;
      refs[spotId] = markerRef.current;
      return () => {
        delete refs[spotId];
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id]);

  const icon = useMemo(() => makeIcon(spot.category), [spot.category]);

  const eventHandlers = useMemo(() => ({
    contextmenu: (e: L.LeafletMouseEvent) => {
      if (longPressActiveRef.current) return;
      L.DomEvent.stopPropagation(e);
      onContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        isPoint: true,
        spotId: spot.id ?? null,
      });
    },
  // longPressActiveRef is a stable ref — its identity never changes, only .current does.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [spot.id, onContextMenu]);

  return (
    <Marker
      ref={markerRef}
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      {spot.name && <Popup><b>{spot.name}</b>{spot.category && <><br /><span style={{ opacity: 0.7 }}>{spot.category}</span></>}</Popup>}
    </Marker>
  );
}

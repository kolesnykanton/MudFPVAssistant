import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { FlightSpot } from '../../types';
import type { ContextMenuState } from './FpvMap';
import droneIconUrl from '../../assets/drone-icon.svg';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const droneIcon = L.icon({
  iconUrl: droneIconUrl,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  shadowUrl: markerShadowUrl,
  shadowSize: [32, 32],
  shadowAnchor: [16, 16],
});

interface SpotMarkerProps {
  spot: FlightSpot;
  onContextMenu: (state: ContextMenuState) => void;
}

export function SpotMarker({ spot, onContextMenu }: SpotMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el && spot.id) el.dataset.spotId = spot.id;
  }, [spot.id]);

  return (
    <Marker
      ref={markerRef}
      position={[spot.latitude, spot.longitude]}
      icon={droneIcon}
      eventHandlers={{
        contextmenu: (e) => {
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
      }}
    >
      {spot.name && <Popup><b>{spot.name}</b></Popup>}
    </Marker>
  );
}

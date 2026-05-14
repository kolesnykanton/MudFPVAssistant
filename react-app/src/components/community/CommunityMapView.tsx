import 'leaflet/dist/leaflet.css';
import { useEffect, type RefObject } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMediaQuery } from '@mantine/hooks';
import { CommunitySpotMarker } from '../map/CommunitySpotMarker';
import type { FlyToTarget } from '../map/FpvMap';
import type { CommunitySpot, WithId } from '../../types';

export type { FlyToTarget as CommunityFlyToTarget };

function FitBoundsOrGeolocate({ spots }: { spots: WithId<CommunitySpot>[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length > 0) {
      const bounds = L.latLngBounds(spots.map(s => [s.latitude, s.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else {
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => map.setView([coords.latitude, coords.longitude], 11, { animate: false }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function FlyTo({ target }: { target: FlyToTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 16, { duration: 0.6 });
  }, [map, target]);
  return null;
}

interface Props {
  spots: WithId<CommunitySpot>[];
  favoriteIds: Set<string>;
  onFavoriteToggle: (spotId: string) => Promise<void>;
  onClone: (spot: WithId<CommunitySpot>) => void;
  flyToTarget?: FlyToTarget | null;
}

const noop = () => {};
const mapStyle = { width: '100%', height: 'calc(100vh - 140px)', minHeight: 400 };
const longPressInactive = { current: false } as RefObject<boolean>;

export function CommunityMapView({ spots, favoriteIds, onFavoriteToggle, onClone, flyToTarget }: Props) {
  const isMobile = useMediaQuery('(max-width: 48em)', true);

  return (
    <MapContainer
      center={[48, 15]}
      zoom={5}
      style={mapStyle}
      zoomControl={false}
    >
      {!isMobile && <ZoomControl position="bottomright" />}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CartoDB"
      />
      <FitBoundsOrGeolocate spots={spots} />
      <FlyTo target={flyToTarget ?? null} />
      {spots.map(spot => (
        <CommunitySpotMarker
          key={spot.id}
          spot={spot}
          isFavorited={favoriteIds.has(spot.id!)}
          onFavoriteToggle={onFavoriteToggle}
          onClone={onClone}
          onContextMenu={noop}
          longPressActiveRef={longPressInactive}
        />
      ))}
    </MapContainer>
  );
}

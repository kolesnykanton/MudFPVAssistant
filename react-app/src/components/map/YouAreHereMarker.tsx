import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FlyToTarget } from './FpvMap';

interface Props {
  flyToTargetRef: React.MutableRefObject<FlyToTarget | null>;
}

export function YouAreHereMarker({ flyToTargetRef }: Props) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number;
    let done = false;
    let best: GeolocationCoordinates | null = null;

    const accept = (coords: GeolocationCoordinates) => {
      done = true;
      navigator.geolocation.clearWatch(watchId);
      setLocation([coords.latitude, coords.longitude]);
      if (!flyToTargetRef.current) {
        map.setView([coords.latitude, coords.longitude], 13, { animate: false });
      }
    };

    // Fallback: after 10 s accept whatever best fix we received
    const fallbackTimer = setTimeout(() => {
      if (!done && best) accept(best);
    }, 10000);

    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (!best || coords.accuracy < best.accuracy) best = coords;
        if (!done && coords.accuracy <= 500) {
          clearTimeout(fallbackTimer);
          accept(coords);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        clearTimeout(fallbackTimer);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimer);
    };
  }, [map]);

  useEffect(() => {
    if (!location || !map) return;

    const blueIcon = L.divIcon({
      className: 'you-are-here-marker',
      html: `<div style="
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        cursor: pointer;
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });

    markerRef.current = L.marker(location, {
      icon: blueIcon,
      title: 'You are here',
    })
      .addTo(map)
      .bindPopup('<b>You</b>');

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [location, map]);

  return null;
}

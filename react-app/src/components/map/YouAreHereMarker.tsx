import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export function YouAreHereMarker() {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!location || !map) return;

    // Create blue dot marker for "You are here"
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
      .bindPopup('<b>You</b>')
      .openPopup();

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [location, map]);

  return null;
}

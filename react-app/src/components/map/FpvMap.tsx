import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, LayersControl, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FlightSpot } from '../../types';
import { MapControls } from './MapControls';
import { WeatherLayers } from './WeatherLayers';
import { SpotMarker } from './SpotMarker';
import { MapInteraction } from './MapInteraction';

const AUTO_CENTER_SESSION_KEY = 'mfa-map-auto-centered';

function MapAutoCenter() {
  const map = useMap();
  useEffect(() => {
    if (sessionStorage.getItem(AUTO_CENTER_SESSION_KEY) === '1') return;
    sessionStorage.setItem(AUTO_CENTER_SESSION_KEY, '1');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => map.setView([coords.latitude, coords.longitude], 13, { animate: false }),
      () => { /* permission denied — keep default */ },
      { timeout: 8000 },
    );
  }, [map]);
  return null;
}

function FitBoundsButton({ spots }: { spots: FlightSpot[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length === 0) return;
    const latlngs = spots.map(s => L.latLng(s.latitude, s.longitude));
    const bounds = L.latLngBounds(latlngs);

    const FitControl = L.Control.extend({
      onAdd() {
        const el = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        el.title = 'Fit all spots';
        el.setAttribute('aria-label', 'Fit all spots');
        el.style.cssText = 'width:30px;height:30px;font-size:16px;cursor:pointer;background:#fff;border:none;line-height:1;';
        el.textContent = '⊡';
        L.DomEvent.on(el, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        });
        return el;
      },
    });
    const btn = new FitControl({ position: 'topleft' });
    btn.addTo(map);
    return () => { map.removeControl(btn); };
  // re-derive when spot positions change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, spots.length]);

  return null;
}

export interface ContextMenuState {
  x: number;
  y: number;
  lat: number;
  lng: number;
  isPoint: boolean;
  spotId: string | null;
}

interface FpvMapProps {
  spots: FlightSpot[];
  openWeatherApiKey?: string;
  onContextMenu: (state: ContextMenuState) => void;
}

export const FpvMap = memo(function FpvMap({ spots, openWeatherApiKey, onContextMenu }: FpvMapProps) {
  const longPressActiveRef = useRef(false);
  return (
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={13}
      style={{
        width: '100%',
        height: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      } as React.CSSProperties}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OSM Standard">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Esri Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="CartoDB Light">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="CartoDB Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />
        </LayersControl.BaseLayer>
        <WeatherLayers openWeatherApiKey={openWeatherApiKey} />
      </LayersControl>
      <MapAutoCenter />
      <MapControls />
      {spots.length > 0 && <FitBoundsButton spots={spots} />}
      <MapInteraction onContextMenu={onContextMenu} longPressActiveRef={longPressActiveRef} />
      {spots.map(spot => spot.id
        ? <SpotMarker key={spot.id} spot={spot} onContextMenu={onContextMenu} longPressActiveRef={longPressActiveRef} />
        : null
      )}
    </MapContainer>
  );
});

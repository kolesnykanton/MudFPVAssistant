import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, LayersControl, ZoomControl } from 'react-leaflet';
import type { FlightSpot } from '../../types';
import { MapControls } from './MapControls';
import { WeatherLayers } from './WeatherLayers';
import { SpotMarker } from './SpotMarker';
import { MapInteraction } from './MapInteraction';

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

export function FpvMap({ spots, openWeatherApiKey, onContextMenu }: FpvMapProps) {
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
      <MapControls />
      <MapInteraction onContextMenu={onContextMenu} />
      {spots.map(spot => spot.id && (
        <SpotMarker key={spot.id} spot={spot} onContextMenu={onContextMenu} />
      ))}
    </MapContainer>
  );
}

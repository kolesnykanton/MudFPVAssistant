import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, memo, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { MapContainer, TileLayer, LayersControl, ZoomControl, useMap } from 'react-leaflet';
import { useWeatherAnimation } from '../../context/WeatherAnimationContext';
import L from 'leaflet';
import type { FlightInfo, FlightSpot, WithId } from '../../types';
import { MapControls } from './MapControls';
import { WeatherLayers, RAINVIEWER_OVERLAY_NAME, TOMORROWIO_OVERLAY_NAME } from './WeatherLayers';
import { WeatherAnimationControl } from './WeatherAnimationControl';
import { WeatherPanel } from './WeatherPanel';
import { MarkerCluster } from './MarkerCluster';
import { YouAreHereMarker } from './YouAreHereMarker';
import { MapInteraction } from './MapInteraction';
import { SmoothRadarLayer } from './SmoothRadarLayer';

/**
 * Listens for overlayadd/overlayremove on both radar overlays.
 * Updates context's activeSource and mounts SmoothRadarLayer only when that overlay is active.
 * When both are simultaneously active, the most recently activated drives the timeline control.
 */
function RadarOverlayManager() {
  const { rvFrames, tioFrames, currentFrameIndex, setActiveSource } = useWeatherAnimation();
  const map = useMap();
  const [rvActive, setRvActive] = useState(false);
  const [tioActive, setTioActive] = useState(false);
  const rvActiveRef = useRef(false);
  const tioActiveRef = useRef(false);

  useEffect(() => {
    const onAdd = (e: L.LayersControlEvent) => {
      if (e.name === RAINVIEWER_OVERLAY_NAME) {
        rvActiveRef.current = true;
        setRvActive(true);
        setActiveSource('rainviewer');
      }
      if (e.name === TOMORROWIO_OVERLAY_NAME) {
        tioActiveRef.current = true;
        setTioActive(true);
        setActiveSource('tomorrowio');
      }
    };
    const onRemove = (e: L.LayersControlEvent) => {
      if (e.name === RAINVIEWER_OVERLAY_NAME) {
        rvActiveRef.current = false;
        setRvActive(false);
        setActiveSource(tioActiveRef.current ? 'tomorrowio' : null);
      }
      if (e.name === TOMORROWIO_OVERLAY_NAME) {
        tioActiveRef.current = false;
        setTioActive(false);
        setActiveSource(rvActiveRef.current ? 'rainviewer' : null);
      }
    };

    map.on('overlayadd', onAdd);
    map.on('overlayremove', onRemove);
    return () => {
      map.off('overlayadd', onAdd);
      map.off('overlayremove', onRemove);
    };
  }, [map, setActiveSource]);

  return (
    <>
      {rvActive && (
        <SmoothRadarLayer frames={rvFrames} currentIndex={currentFrameIndex} maxNativeZoom={7} />
      )}
      {tioActive && (
        <SmoothRadarLayer frames={tioFrames} currentIndex={currentFrameIndex} maxNativeZoom={12} />
      )}
    </>
  );
}

/** Shows the animation timeline control whenever any radar overlay is active. */
const RadarAnimationControl = memo(function RadarAnimationControl() {
  const {
    activeSource, frames, nowcastStartIndex,
    currentFrameIndex, isPlaying,
    setCurrentFrameIndex, setIsPlaying,
  } = useWeatherAnimation();
  const map = useMap();

  const handleTogglePlay = useCallback(() => {
    if (!isPlaying && frames.length > 0 && currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying(p => !p);
  }, [isPlaying, currentFrameIndex, frames.length, setCurrentFrameIndex, setIsPlaying]);

  const handleMapDragStart = useCallback(() => map.dragging.disable(), [map]);
  const handleMapDragEnd = useCallback(() => map.dragging.enable(), [map]);

  if (!activeSource || frames.length === 0) return null;

  return (
    <WeatherAnimationControl
      frames={frames}
      currentIndex={currentFrameIndex}
      nowcastStartIndex={nowcastStartIndex}
      isPlaying={isPlaying}
      onSeek={setCurrentFrameIndex}
      onTogglePlay={handleTogglePlay}
      onMapDragStart={handleMapDragStart}
      onMapDragEnd={handleMapDragEnd}
    />
  );
});

export interface FlyToTarget {
  lat: number;
  lng: number;
  spotId?: string;
  nonce: number;
}

function FlyToTarget({ target, markerRefs, clusterGroupRef }: {
  target: FlyToTarget | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
  clusterGroupRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const marker = target.spotId ? markerRefs.current[target.spotId] : null;
    const clusterGroup = clusterGroupRef.current;

    if (marker && clusterGroup) {
      // zoomToShowLayer handles unclustering the marker before opening the popup,
      // so the popup isn't silently swallowed by a cluster at zoom < disableClusteringAtZoom.
      clusterGroup.zoomToShowLayer(marker, () => marker.openPopup());
    } else {
      map.flyTo([target.lat, target.lng], 16, { duration: 0.6 });
      if (marker) marker.openPopup();
    }
  }, [map, target, markerRefs, clusterGroupRef]);
  return null;
}

function FitBoundsButton({ spots }: { spots: FlightSpot[] }) {
  const map = useMap();
  const boundsKey = spots.map(s => `${s.latitude},${s.longitude}`).join('|');
  useEffect(() => {
    if (spots.length === 0) return;
    const latlngs = spots.map(s => L.latLng(s.latitude, s.longitude));
    const bounds = L.latLngBounds(latlngs);

    const FitControl = L.Control.extend({
      onAdd() {
        const el = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        el.title = 'Fit all spots';
        el.setAttribute('aria-label', 'Fit all spots');
        el.style.cssText = 'width:30px;height:30px;cursor:pointer;background:#fff;border:none;display:flex;align-items:center;justify-content:center;';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2 -2v-2"/></svg>';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, boundsKey]);

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
  flyToTarget?: FlyToTarget | null;
  panelOpen?: boolean;
  onTogglePanel?: () => void;
  flightCountBySpot?: Record<string, number>;
  recentFlightsBySpot?: Record<string, WithId<FlightInfo>[]>;
}

function PanelToggleButton({ panelOpen, onToggle }: { panelOpen?: boolean; onToggle?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onToggle || panelOpen === undefined) return;

    const ToggleControl = L.Control.extend({
      onAdd() {
        const el = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        el.title = 'Toggle spots panel';
        el.setAttribute('aria-label', 'Toggle spots panel');
        el.style.cssText = 'width:30px;height:30px;cursor:pointer;background:#fff;border:none;display:flex;align-items:center;justify-content:center;';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
        L.DomEvent.on(el, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          onToggle();
        });
        return el;
      },
    });
    const btn = new ToggleControl({ position: 'topleft' });
    btn.addTo(map);
    return () => { map.removeControl(btn); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, onToggle]);

  return null;
}

export const FpvMap = memo(function FpvMap({
  spots, openWeatherApiKey, onContextMenu, flyToTarget,
  panelOpen, onTogglePanel, flightCountBySpot, recentFlightsBySpot,
}: FpvMapProps) {
  const longPressActiveRef = useRef(false);
  const markerRefsRef = useRef<Record<string, L.Marker>>({});
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const flyToTargetRef = useRef(flyToTarget ?? null);
  useEffect(() => { flyToTargetRef.current = flyToTarget ?? null; }, [flyToTarget]);
  // Touch devices use pinch-to-zoom; visible zoom buttons are a desktop affordance only.
  // Default true so zoom never flashes on mobile before the query resolves.
  const isMobile = useMediaQuery('(max-width: 48em)', true);
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
      {!isMobile && <ZoomControl position="bottomright" />}
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
      <YouAreHereMarker flyToTargetRef={flyToTargetRef} />
      <MapControls />
      <WeatherPanel />
      <RadarOverlayManager />
      <RadarAnimationControl />
      {spots.length > 0 && <FitBoundsButton spots={spots} />}
      {onTogglePanel !== undefined && <PanelToggleButton panelOpen={panelOpen} onToggle={onTogglePanel} />}
      {flyToTarget && <FlyToTarget target={flyToTarget} markerRefs={markerRefsRef} clusterGroupRef={clusterGroupRef} />}
      <MapInteraction onContextMenu={onContextMenu} longPressActiveRef={longPressActiveRef} />
      {spots.length > 0 && (
        <MarkerCluster
          spots={spots}
          onContextMenu={onContextMenu}
          longPressActiveRef={longPressActiveRef}
          markerRefs={markerRefsRef}
          clusterGroupRef={clusterGroupRef}
          flightCountBySpot={flightCountBySpot ?? {}}
          recentFlightsBySpot={recentFlightsBySpot ?? {}}
        />
      )}
    </MapContainer>
  );
});

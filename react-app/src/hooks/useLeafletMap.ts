import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { FlightSpot, LeafletMap } from '../types';

interface MapModule {
  createMap(elementId: string): LeafletMap;
  addWeatherOverlays(map: LeafletMap, apiKey: string): void;
  createMarkerRegistry(): {
    sync(spots: FlightSpot[], map: LeafletMap): void;
    clear(map: LeafletMap): void;
  };
}

interface UseLeafletMapReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  mapInstanceRef: RefObject<LeafletMap | null>;
  mapReady: boolean;
  pluginWarnings: string[];
  dismissPluginWarnings(): void;
  addWeatherOverlays(apiKey: string): void;
  syncSpots(spots: FlightSpot[]): void;
}

export function useLeafletMap(elementId: string): UseLeafletMapReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const moduleRef = useRef<MapModule | null>(null);
  const registryRef = useRef<ReturnType<MapModule['createMarkerRegistry']> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [pluginWarnings, setPluginWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    (import('../map/mapCore.js') as Promise<MapModule>).then(mod => {
      if (cancelled || mapInstanceRef.current) return;
      moduleRef.current = mod;
      const map = mod.createMap(elementId);
      mapInstanceRef.current = map;
      registryRef.current = mod.createMarkerRegistry();
      if (map._pluginFailures?.length) setPluginWarnings(map._pluginFailures);
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current._rainviewerController?.abort();
        registryRef.current?.clear(mapInstanceRef.current);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        registryRef.current = null;
        moduleRef.current = null;
        setMapReady(false);
      }
    };
  }, [elementId]);

  const addWeatherOverlays = useCallback((apiKey: string) => {
    if (!mapInstanceRef.current || !moduleRef.current) return;
    moduleRef.current.addWeatherOverlays(mapInstanceRef.current, apiKey);
  }, []);

  const syncSpots = useCallback((spots: FlightSpot[]) => {
    if (!mapInstanceRef.current || !registryRef.current) return;
    registryRef.current.sync(spots, mapInstanceRef.current);
  }, []);

  const dismissPluginWarnings = useCallback(() => setPluginWarnings([]), []);

  return { containerRef, mapInstanceRef, mapReady, pluginWarnings, dismissPluginWarnings, addWeatherOverlays, syncSpots };
}

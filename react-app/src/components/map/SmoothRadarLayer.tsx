import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { AnimatedFrame } from '../../hooks/useWeatherRadar';

interface SmoothRadarLayerProps {
  frames: AnimatedFrame[];
  currentIndex: number;
  opacity?: number;
  maxNativeZoom?: number;
}

/**
 * Implements RainViewer's recommended animation technique: lazy-create one L.TileLayer per frame,
 * keep all layers mounted on the map, and crossfade between them via setOpacity.
 * After the first playthrough tiles are cached by the browser, so subsequent passes are instant.
 */
export function SmoothRadarLayer({
  frames,
  currentIndex,
  opacity = 0.6,
  maxNativeZoom = 7,
}: SmoothRadarLayerProps) {
  const map = useMap();
  const cacheRef = useRef<Map<number, L.TileLayer>>(new Map());
  const prevIndexRef = useRef<number>(-1);
  const prevFramesRef = useRef<AnimatedFrame[]>([]);

  // Remove all cached layers when component unmounts
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.forEach(layer => { try { layer.remove(); } catch { /* already removed */ } });
      cache.clear();
    };
  }, []);

  // When the frames array changes (source switch or API refresh), purge the stale cache
  useEffect(() => {
    if (frames === prevFramesRef.current) return;
    prevFramesRef.current = frames;

    const cache = cacheRef.current;
    cache.forEach(layer => { try { layer.remove(); } catch { /* already removed */ } });
    cache.clear();
    prevIndexRef.current = -1;
  }, [frames]);

  // Crossfade to the target frame: lazy-create if needed, fade old out, fade new in
  useEffect(() => {
    if (frames.length === 0) return;
    const safeIndex = Math.min(currentIndex, frames.length - 1);

    const cache = cacheRef.current;

    // Fade out the previously active layer
    const prevLayer = cache.get(prevIndexRef.current);
    if (prevLayer) prevLayer.setOpacity(0);

    // Lazy-create the target layer on first access
    let target = cache.get(safeIndex);
    if (!target) {
      target = L.tileLayer(frames[safeIndex].url, {
        opacity: 0,
        maxNativeZoom,
        // overlayPane sits at CSS z-index 400 — above all tilePane base layers (200)
        pane: 'overlayPane',
        attribution: '',
      });
      target.addTo(map);
      cache.set(safeIndex, target);
    }

    target.setOpacity(opacity);
    prevIndexRef.current = safeIndex;
  }, [frames, currentIndex, map, opacity, maxNativeZoom]);

  return null;
}

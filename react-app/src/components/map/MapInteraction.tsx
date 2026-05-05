import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { ContextMenuState } from './FpvMap';

const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

interface MapInteractionProps {
  onContextMenu: (state: ContextMenuState) => void;
}

export function MapInteraction({ onContextMenu }: MapInteractionProps) {
  const map = useMap();

  // Desktop right-click on map background (not on a marker — markers stop propagation)
  useMapEvents({
    contextmenu: (e) => {
      onContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        isPoint: false,
        spotId: null,
      });
    },
  });

  // Mobile long-press
  useEffect(() => {
    const container = map.getContainer();
    let timer: number | null = null;
    let startX = 0;
    let startY = 0;
    let startEvent: PointerEvent | null = null;

    const clear = () => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      startX = e.clientX;
      startY = e.clientY;
      startEvent = e;
      clear();
      timer = window.setTimeout(() => {
        timer = null;
        if (!startEvent) return;
        const latlng = map.mouseEventToLatLng(startEvent);
        const markerEl = (startEvent.target as Element).closest<HTMLElement>('[data-spot-id]');
        const spotId = markerEl?.dataset.spotId ?? null;
        onContextMenu({
          x: startEvent.clientX,
          y: startEvent.clientY,
          lat: latlng.lat,
          lng: latlng.lng,
          isPoint: spotId !== null,
          spotId,
        });
      }, LONG_PRESS_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (timer === null) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE_PX) clear();
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', clear);
    container.addEventListener('pointercancel', clear);

    return () => {
      clear();
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', clear);
      container.removeEventListener('pointercancel', clear);
    };
  }, [map, onContextMenu]);

  return null;
}

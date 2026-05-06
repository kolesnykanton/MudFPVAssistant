import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { ContextMenuState } from './FpvMap';

const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

interface MapInteractionProps {
  onContextMenu: (state: ContextMenuState) => void;
  longPressActiveRef: React.RefObject<boolean>;
}

export function MapInteraction({ onContextMenu, longPressActiveRef }: MapInteractionProps) {
  const map = useMap();

  // Desktop right-click. On touch, the OS also fires contextmenu at ~700ms
  // (overlapping our 600ms timer). Skip it when our timer owns the interaction
  // to prevent a double-call that overwrites the menu position.
  useMapEvents({
    contextmenu: (e) => {
      if (longPressActiveRef.current) {
        e.originalEvent.preventDefault();
        return;
      }
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

  useEffect(() => {
    const container = map.getContainer();
    let timer: number | null = null;
    let startX = 0;
    let startY = 0;
    let startEvent: PointerEvent | null = null;

    const clear = () => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      longPressActiveRef.current = false;
      document.body.style.userSelect = '';
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      startX = e.clientX;
      startY = e.clientY;
      startEvent = e;
      clear(); // reset any previous pending press
      longPressActiveRef.current = true;
      document.body.style.userSelect = 'none';
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
        // Do NOT call clear() here — longPressActiveRef must stay true until
        // pointerup so the browser's native contextmenu event (~700ms) is
        // still blocked by the guard in useMapEvents above.
      }, LONG_PRESS_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (timer === null) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE_PX) clear();
    };

    // Belt-and-suspenders: CSS user-select already blocks selection in most
    // cases; this prevents it at the event level for any element that might
    // not inherit the property.
    const onSelectStart = (e: Event) => {
      if (longPressActiveRef.current) e.preventDefault();
    };

    // Prevent the browser's native context-menu popup from appearing on top of ours.
    const onContextMenuNative = (e: Event) => {
      if (longPressActiveRef.current) e.preventDefault();
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', clear);
    container.addEventListener('pointercancel', clear);
    container.addEventListener('selectstart', onSelectStart);
    container.addEventListener('contextmenu', onContextMenuNative);

    return () => {
      clear();
      document.body.style.userSelect = '';
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', clear);
      container.removeEventListener('pointercancel', clear);
      container.removeEventListener('selectstart', onSelectStart);
      container.removeEventListener('contextmenu', onContextMenuNative);
    };
  }, [map, onContextMenu, longPressActiveRef]);

  return null;
}

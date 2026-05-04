import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { useUserCollection } from '../hooks/useUserCollection';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import type { FlightSpot } from '../types';
import FlightSpotEditDialog from '../components/FlightSpotEditDialog';

interface ContextMenuState {
  x: number;
  y: number;
  lat: number;
  lng: number;
  isPoint: boolean;
  spotId: string | null;
}

const MENU_WIDTH = 170;
const MENU_HEIGHT_APPROX = 80;
const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export default function MapSpotSave() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const contextMenuOpenedAt = useRef<number>(0);

  const { uid } = useAuth();
  const { settings } = useSettings();
  const { items: spots, add, update, remove } = useUserCollection<FlightSpot>('FlightSpots');

  const [mapReady, setMapReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Read spotId attached to the marker icon DOM by addMarker()
  const spotIdFromTarget = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    const markerEl = target.closest<HTMLElement>('.leaflet-marker-icon, .leaflet-marker-shadow');
    return markerEl?.dataset.spotId ?? null;
  };

  const openContextMenuFromEvent = (
    clientX: number,
    clientY: number,
    target: EventTarget | null,
    nativeEvent: MouseEvent | PointerEvent,
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latlng = map.mouseEventToLatLng(nativeEvent);
    const spotId = spotIdFromTarget(target);
    contextMenuOpenedAt.current = Date.now();
    setContextMenu({
      x: clientX,
      y: clientY,
      lat: latlng.lat,
      lng: latlng.lng,
      isPoint: spotId !== null,
      spotId,
    });
  };

  // Desktop right-click — handled directly in React
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    openContextMenuFromEvent(e.clientX, e.clientY, e.target, e.nativeEvent);
  };

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      if (cancelled || mapInstanceRef.current) return;
      const map = mod.createMap('fpvMap');
      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Touch long-press — native pointer listeners scoped to the map div.
  // Re-attached when the map is ready.
  useEffect(() => {
    const div = mapRef.current;
    if (!div || !mapReady) return;

    let timer: number | null = null;
    let startX = 0;
    let startY = 0;
    let startTarget: EventTarget | null = null;

    const clear = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      startX = e.clientX;
      startY = e.clientY;
      startTarget = e.target;
      clear();
      timer = window.setTimeout(() => {
        timer = null;
        openContextMenuFromEvent(e.clientX, e.clientY, startTarget, e);
      }, LONG_PRESS_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (timer === null) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE_PX) {
        clear();
      }
    };

    div.addEventListener('pointerdown', onDown);
    div.addEventListener('pointermove', onMove);
    div.addEventListener('pointerup', clear);
    div.addEventListener('pointercancel', clear);

    return () => {
      clear();
      div.removeEventListener('pointerdown', onDown);
      div.removeEventListener('pointermove', onMove);
      div.removeEventListener('pointerup', clear);
      div.removeEventListener('pointercancel', clear);
    };
  }, [mapReady]);

  // Add weather overlays once map is ready and API key is available
  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !openWeatherApiKey) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      mod.addWeatherOverlays(mapInstanceRef.current, openWeatherApiKey);
    });
  }, [mapReady, openWeatherApiKey]);

  // Sync spots to map markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      mod.clearMarkers(mapInstanceRef.current);
      spots.forEach((spot: FlightSpot) => {
        mod.addMarker(spot, mapInstanceRef.current);
      });
    });
  }, [spots, mapReady]);

  const handleAddSpot = () => {
    if (!contextMenu) return;
    setNewSpotCoords({ lat: contextMenu.lat, lng: contextMenu.lng });
    setEditingSpot(null);
    setDialogOpen(true);
    setContextMenu(null);
  };

  const handleEditSpot = () => {
    if (!contextMenu?.spotId) return;
    const spot = spots.find(s => s.id === contextMenu.spotId) ?? null;
    setEditingSpot(spot);
    setNewSpotCoords(null);
    setDialogOpen(true);
    setContextMenu(null);
  };

  const handleDeleteSpot = async () => {
    if (contextMenu?.spotId) {
      await remove(contextMenu.spotId);
    }
    setContextMenu(null);
  };

  const handleSaveSpot = async (spotData: Omit<FlightSpot, 'id'>) => {
    if (editingSpot?.id) {
      await update(editingSpot.id, spotData);
    } else {
      await add(spotData);
    }
    setDialogOpen(false);
  };

  const closeContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(null);
  };

  const menuLeft = contextMenu
    ? Math.min(contextMenu.x + 2, window.innerWidth - MENU_WIDTH)
    : 0;
  const menuTop = contextMenu
    ? Math.min(contextMenu.y + 2, window.innerHeight - MENU_HEIGHT_APPROX)
    : 0;

  if (!uid) {
    return <Text p="xl">Please sign in to view flight spots.</Text>;
  }

  return (
    <Box>
      <Title order={2} p="sm" pb={0}>Flight Spot Saver</Title>
      <Box style={{ position: 'relative' }} mt="sm">
        <div
          id="fpvMap"
          ref={mapRef}
          style={{ width: '100%', height: '80vh' }}
          onContextMenu={handleContextMenu}
        />

        {contextMenu && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
              onClick={closeContextMenu}
              onContextMenu={closeContextMenu}
            />
            <Paper
              withBorder
              shadow="md"
              style={{
                position: 'fixed',
                left: menuLeft,
                top: menuTop,
                zIndex: 10000,
                minWidth: MENU_WIDTH,
                padding: '4px 0',
                overflow: 'hidden',
              }}
            >
              <Stack gap={0}>
                {!contextMenu.isPoint && (
                  <Button
                    variant="subtle"
                    size="sm"
                    justify="start"
                    fullWidth
                    style={{ borderRadius: 0 }}
                    onClick={handleAddSpot}
                  >
                    Add spot
                  </Button>
                )}
                {contextMenu.isPoint && (
                  <>
                    <Button
                      variant="subtle"
                      size="sm"
                      justify="start"
                      fullWidth
                      style={{ borderRadius: 0 }}
                      onClick={handleEditSpot}
                    >
                      Edit spot
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="sm"
                      justify="start"
                      fullWidth
                      style={{ borderRadius: 0 }}
                      onClick={handleDeleteSpot}
                    >
                      Delete spot
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Box>

      <FlightSpotEditDialog
        open={dialogOpen}
        spot={editingSpot}
        coords={newSpotCoords ?? undefined}
        onSave={handleSaveSpot}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}

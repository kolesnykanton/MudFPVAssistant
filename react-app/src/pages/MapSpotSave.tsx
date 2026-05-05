import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useUserCollection } from '../hooks/useUserCollection';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import { useLeafletMap } from '../hooks/useLeafletMap';
import type { FlightSpot } from '../types';
import FlightSpotEditDialog, { DIALOG_Z_INDEX } from '../components/FlightSpotEditDialog';

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
  const { containerRef, mapInstanceRef, mapReady, pluginWarnings, dismissPluginWarnings, addWeatherOverlays, syncSpots } = useLeafletMap('fpvMap');

  const { uid } = useAuth();
  const { settings } = useSettings();
  const { items: spots, add, update, remove } = useUserCollection<FlightSpot>('FlightSpots');

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const spotIdFromTarget = useCallback((target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    const markerEl = target.closest<HTMLElement>('.leaflet-marker-icon, .leaflet-marker-shadow');
    return markerEl?.dataset.spotId ?? null;
  }, []);

  const openContextMenuFromEvent = useCallback((
    clientX: number,
    clientY: number,
    target: EventTarget | null,
    nativeEvent: MouseEvent | PointerEvent,
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latlng = map.mouseEventToLatLng(nativeEvent);
    const spotId = spotIdFromTarget(target);
    setContextMenu({
      x: clientX,
      y: clientY,
      lat: latlng.lat,
      lng: latlng.lng,
      isPoint: spotId !== null,
      spotId,
    });
  }, [spotIdFromTarget]);

  // Desktop right-click — handled directly in React
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    openContextMenuFromEvent(e.clientX, e.clientY, e.target, e.nativeEvent);
  };

  // Touch long-press — native pointer listeners scoped to the map div.
  // Re-attached when the map is ready.
  useEffect(() => {
    const div = containerRef.current;
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
  }, [mapReady, openContextMenuFromEvent]);

  // Dismiss context menu on Escape
  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  // Add weather overlays once map is ready and API key is available
  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;
  useEffect(() => {
    if (!mapReady || !openWeatherApiKey) return;
    addWeatherOverlays(openWeatherApiKey);
  }, [mapReady, openWeatherApiKey, addWeatherOverlays]);

  // Sync spots to map markers (diff-based — only adds/removes changed spots)
  useEffect(() => {
    if (!mapReady) return;
    syncSpots(spots);
  }, [spots, mapReady, syncSpots]);

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
    if (!contextMenu?.spotId) return;
    try {
      await remove(contextMenu.spotId);
      setContextMenu(null);
    } catch {
      setDeleteError('Failed to delete spot. Please try again.');
    }
  };

  const handleSaveSpot = async (spotData: Omit<FlightSpot, 'id'>): Promise<void> => {
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
      {pluginWarnings.length > 0 && (
        <Alert color="yellow" variant="light" withCloseButton onClose={dismissPluginWarnings} mx="sm" mt="sm">
          Some map controls failed to load: {pluginWarnings.join(', ')}.
        </Alert>
      )}
      {deleteError && (
        <Alert color="red" variant="light" withCloseButton onClose={() => setDeleteError(null)} mx="sm" mt="sm">
          {deleteError}
        </Alert>
      )}
      <Box style={{ position: 'relative' }} mt="sm">
        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: 'var(--mantine-color-body)' }}>
            <Loader size="lg" />
          </div>
        )}
        <div
          id="fpvMap"
          ref={containerRef}
          role="application"
          aria-label="Flight spot map"
          style={{ width: '100%', height: '80vh' }}
          onContextMenu={handleContextMenu}
        />

        {contextMenu && (
          <>
            <div
              role="presentation"
              style={{ position: 'fixed', inset: 0, zIndex: DIALOG_Z_INDEX }}
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
                zIndex: DIALOG_Z_INDEX + 1,
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

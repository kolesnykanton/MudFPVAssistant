import React, { useEffect, useRef, useState, useCallback } from 'react';
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

export default function MapSpotSave() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { uid } = useAuth();
  const { settings } = useSettings();
  const { items: spots, add, update, remove } = useUserCollection<FlightSpot>('FlightSpots');

  const [mapReady, setMapReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleContextMenu = useCallback((payload: ContextMenuState) => {
    setContextMenu(payload);
  }, []);

  const handleMapClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(null);
  };

  // Initialize map once (without API key — loaded async separately)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      // Guard against StrictMode double-invoke or component unmount before import resolves
      if (cancelled || mapInstanceRef.current) return;
      const map = mod.createMap('fpvMap', {
        onContextMenu: handleContextMenu,
        onMapClick: handleMapClick,
      });
      mapInstanceRef.current = map;
      setMapReady(true); // triggers marker sync effect
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // empty deps - initialize once

  // Add weather overlays once map is ready and API key is available
  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !openWeatherApiKey) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      mod.addWeatherOverlays(mapInstanceRef.current, openWeatherApiKey);
    });
  }, [mapReady, openWeatherApiKey]);

  // Sync spots to map markers — runs when map is ready OR spots change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      mod.clearMarkers(mapInstanceRef.current);
      spots.forEach((spot: FlightSpot) => {
        mod.addMarker(spot, mapInstanceRef.current, handleContextMenu);
      });
    });
  }, [spots, handleContextMenu, mapReady]);

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

  // Clamp position so menu never overflows the viewport
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
          onContextMenu={e => e.preventDefault()}
        />

        {/* Transparent backdrop + context menu.
            Clicking/right-clicking the backdrop closes the menu with no
            extra useEffect or stopPropagation needed. */}
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

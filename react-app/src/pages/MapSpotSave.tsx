import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Menu, Text, Title } from '@mantine/core';
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

  // Initialize map once (without API key — loaded async separately)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      const map = mod.createMap('fpvMap', {
        onContextMenu: handleContextMenu,
        onMapClick: handleMapClick,
      });
      mapInstanceRef.current = map;
      setMapReady(true); // triggers marker sync effect
    });

    return () => {
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

        <Menu
          opened={!!contextMenu}
          onClose={() => setContextMenu(null)}
          position="bottom-start"
        >
          <Menu.Target>
            {/* Invisible anchor positioned via style override */}
            <div
              style={{
                position: 'fixed',
                left: contextMenu?.x ?? 0,
                top: contextMenu?.y ?? 0,
                width: 1,
                height: 1,
                pointerEvents: 'none',
              }}
            />
          </Menu.Target>
          <Menu.Dropdown>
            {!contextMenu?.isPoint && (
              <Menu.Item onClick={handleAddSpot}>Add spot</Menu.Item>
            )}
            {contextMenu?.isPoint && (
              <>
                <Menu.Item onClick={handleEditSpot}>Edit spot</Menu.Item>
                <Menu.Item color="red" onClick={handleDeleteSpot}>Delete spot</Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
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

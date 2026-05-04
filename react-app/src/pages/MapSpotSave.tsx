import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
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

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      const apiKey = settings.apiKeys?.openWeatherApiKey || '';
      const map = mod.createMap('fpvMap', {
        onContextMenu: handleContextMenu,
        onMapClick: handleMapClick,
      }, apiKey);
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // empty deps - initialize once

  // Sync spots to map markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('../map/mapCore.js').then((mod: any) => {
      mod.clearMarkers(mapInstanceRef.current);
      spots.forEach((spot: FlightSpot) => {
        mod.addMarker(spot, mapInstanceRef.current, handleContextMenu);
      });
    });
  }, [spots, handleContextMenu]);

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
    return <Typography sx={{ p: 4 }}>Please sign in to view flight spots.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ p: 2 }}>Flight Spot Saver</Typography>
      <Box sx={{ position: 'relative' }}>
        <div
          id="fpvMap"
          ref={mapRef}
          style={{ width: '100%', height: '80vh' }}
          onContextMenu={e => e.preventDefault()}
        />

        <Menu
          open={!!contextMenu}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined}
        >
          {!contextMenu?.isPoint && (
            <MenuItem onClick={handleAddSpot}>Add spot</MenuItem>
          )}
          {contextMenu?.isPoint && [
            <MenuItem key="edit" onClick={handleEditSpot}>Edit spot</MenuItem>,
            <MenuItem key="delete" onClick={handleDeleteSpot}>Delete spot</MenuItem>,
          ]}
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

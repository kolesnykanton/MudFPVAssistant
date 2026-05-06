import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import classes from './MapSpotSave.module.css';
import { useData } from '../context/DataContext';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import type { FlightSpot } from '../types';
import { FpvMap } from '../components/map/FpvMap';
import type { ContextMenuState } from '../components/map/FpvMap';
import FlightSpotEditDialog from '../components/FlightSpotEditDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import MapContextMenu, { type MapContextMenuItem } from '../components/MapContextMenu';

const MENU_WIDTH = 170;

export default function MapSpotSave() {
  const { uid } = useAuth();
  const { settings } = useSettings();
  const { spots, addSpot, updateSpot, deleteSpot } = useData();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingDeleteSpotId, setPendingDeleteSpotId] = useState<string | null>(null);
  const pendingDeleteSpot = pendingDeleteSpotId
    ? spots.find(s => s.id === pendingDeleteSpotId) ?? null
    : null;
  const contextMenuOpenedAt = useRef(0);

  const handleContextMenu = useCallback((state: ContextMenuState) => {
    contextMenuOpenedAt.current = Date.now();
    setContextMenu(state);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [contextMenu]);

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

  const handleDeleteSpot = () => {
    if (!contextMenu?.spotId) return;
    setPendingDeleteSpotId(contextMenu.spotId);
    setContextMenu(null);
  };

  const confirmDeleteSpot = async () => {
    if (!pendingDeleteSpotId) return;
    const id = pendingDeleteSpotId;
    setPendingDeleteSpotId(null);
    try {
      await deleteSpot(id);
      notifications.show({ color: 'green', message: 'Spot deleted.' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to delete spot. Please try again.' });
    }
  };

  const handleSaveSpot = async (spotData: Omit<FlightSpot, 'id'>): Promise<void> => {
    if (editingSpot?.id) {
      await updateSpot(editingSpot.id, spotData);
      notifications.show({ color: 'green', message: 'Spot updated.' });
    } else {
      await addSpot(spotData);
      notifications.show({ color: 'green', message: 'Spot added.' });
    }
    setDialogOpen(false);
  };

  const closeContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (Date.now() - contextMenuOpenedAt.current < 350) return;
    setContextMenu(null);
  }, []);

  const menuItems = useMemo<MapContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    return contextMenu.isPoint
      ? [
          { label: 'Edit spot',   onClick: handleEditSpot },
          { label: 'Delete spot', onClick: handleDeleteSpot, danger: true },
        ]
      : [
          { label: 'Add spot', onClick: handleAddSpot },
        ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenu]);

  const menuHeightApprox = contextMenu?.isPoint ? 80 : 44;
  const menuLeft = contextMenu
    ? Math.min(contextMenu.x + 2, window.innerWidth - MENU_WIDTH)
    : 0;
  const menuTop = contextMenu
    ? Math.min(contextMenu.y + 2, window.innerHeight - menuHeightApprox)
    : 0;

  if (!uid) {
    return <Text p="xl">Please sign in to view flight spots.</Text>;
  }

  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;

  return (
    <Box className={classes.root}>
      <Title order={2} p="sm" pb={0}>Flight Spot Saver</Title>
      <Box className={classes.mapWrapper}>
        <FpvMap
          spots={spots}
          openWeatherApiKey={openWeatherApiKey}
          onContextMenu={handleContextMenu}
        />

        {contextMenu && (
          <>
            <div
              role="presentation"
              style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
              onClick={closeContextMenu}
              onContextMenu={closeContextMenu}
            />
            <MapContextMenu
              left={menuLeft}
              top={menuTop}
              width={MENU_WIDTH}
              items={menuItems}
            />
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

      <ConfirmDialog
        open={pendingDeleteSpotId !== null}
        title="Delete spot"
        message={
          pendingDeleteSpot
            ? `Delete the spot "${pendingDeleteSpot.name}"? This cannot be undone.`
            : 'Delete this spot? This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteSpot}
        onClose={() => setPendingDeleteSpotId(null)}
      />
    </Box>
  );
}

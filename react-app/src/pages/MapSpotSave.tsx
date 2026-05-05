import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { useUserCollection } from '../hooks/useUserCollection';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import type { FlightSpot } from '../types';
import { FpvMap } from '../components/map/FpvMap';
import type { ContextMenuState } from '../components/map/FpvMap';
import FlightSpotEditDialog, { DIALOG_Z_INDEX } from '../components/FlightSpotEditDialog';

const MENU_WIDTH = 170;
const MENU_HEIGHT_APPROX = 80;

export default function MapSpotSave() {
  const { uid } = useAuth();
  const { settings } = useSettings();
  const { items: spots, add, update, remove } = useUserCollection<FlightSpot>('FlightSpots');

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const contextMenuOpenedAt = useRef(0);

  const handleContextMenu = useCallback((state: ContextMenuState) => {
    contextMenuOpenedAt.current = Date.now();
    setContextMenu(state);
  }, []);

  // Dismiss context menu on Escape
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

  const closeContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Guard against the synthetic click/tap browsers fire after a long-press
    // (~50–300ms post-detection). The backdrop is already in the DOM by then
    // and would immediately dismiss the menu the user just opened. 300ms covers
    // all known browser/OS combinations while never blocking deliberate dismissals.
    if (Date.now() - contextMenuOpenedAt.current < 350) return;
    setContextMenu(null);
  }, []);

  const menuLeft = contextMenu
    ? Math.min(contextMenu.x + 2, window.innerWidth - MENU_WIDTH)
    : 0;
  const menuTop = contextMenu
    ? Math.min(contextMenu.y + 2, window.innerHeight - MENU_HEIGHT_APPROX)
    : 0;

  if (!uid) {
    return <Text p="xl">Please sign in to view flight spots.</Text>;
  }

  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;

  return (
    <Box style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
      <Title order={2} p="sm" pb={0}>Flight Spot Saver</Title>
      {deleteError && (
        <Alert color="red" variant="light" withCloseButton onClose={() => setDeleteError(null)} mx="sm" mt="sm">
          {deleteError}
        </Alert>
      )}
      <Box style={{ position: 'relative' }} mt="sm">
        <FpvMap
          spots={spots}
          openWeatherApiKey={openWeatherApiKey}
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

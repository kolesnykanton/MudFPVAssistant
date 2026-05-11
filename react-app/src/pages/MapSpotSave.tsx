import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { Box, Text, Title, Drawer, ActionIcon, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconList, IconLayoutSidebarRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './MapSpotSave.module.css';
import { useData } from '../context/DataContext';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import type { FlightSpot, WithId } from '../types';
import { FpvMap } from '../components/map/FpvMap';
import type { ContextMenuState } from '../components/map/FpvMap';
import { SpotsListPanel } from '../components/map/SpotsListPanel';
import FlightSpotEditDialog from '../components/FlightSpotEditDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import MapContextMenu, { type MapContextMenuItem } from '../components/MapContextMenu';
import { QuickPinFab } from '../components/map/QuickPinFab';

const MENU_WIDTH = 170;
const PANEL_STORAGE_KEY = 'mfa-map-panel-open';

interface FlyToState {
  lat: number;
  lng: number;
  spotId?: string;
  nonce: number;
}

export default function MapSpotSave() {
  const { uid } = useAuth();
  const { settings } = useSettings();
  const { spots, addSpot, updateSpot, deleteSpot } = useData();
  const isDesktop = useMediaQuery('(min-width: 48em)');

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const { refs, floatingStyles, update } = useFloating({
    placement: 'top-start',
    middleware: [offset(16), flip(), shift({ padding: 8 })],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FlightSpot | null>(null);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingDeleteSpotId, setPendingDeleteSpotId] = useState<string | null>(null);
  const pendingDeleteSpot = pendingDeleteSpotId
    ? spots.find(s => s.id === pendingDeleteSpotId) ?? null
    : null;
  const contextMenuOpenedAt = useRef(0);

  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(PANEL_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const [flyToState, setFlyToState] = useState<FlyToState | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(PANEL_STORAGE_KEY, String(panelOpen));
  }, [panelOpen]);

  const handleContextMenu = useCallback((state: ContextMenuState) => {
    contextMenuOpenedAt.current = Date.now();
    setContextMenu(state);
  }, []);

  const handleLocateFromList = useCallback((spot: WithId<FlightSpot>) => {
    setFlyToState({
      lat: spot.latitude,
      lng: spot.longitude,
      spotId: spot.id,
      nonce: Date.now(),
    });
    setMobileDrawerOpen(false);
  }, []);

  const handleEditFromList = useCallback((spot: WithId<FlightSpot>) => {
    setEditingSpot(spot);
    setNewSpotCoords(null);
    setDialogOpen(true);
    setMobileDrawerOpen(false);
  }, []);

  const handleDeleteFromList = useCallback((spot: WithId<FlightSpot>) => {
    setPendingDeleteSpotId(spot.id);
    setMobileDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    refs.setReference({
      getBoundingClientRect: () => DOMRect.fromRect({
        x: contextMenu.x, y: contextMenu.y, width: 0, height: 0,
      }),
    });
    update();
  }, [contextMenu, refs, update]);

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

  const handleSaveSpot = async (spotData: Omit<FlightSpot, 'id'>): Promise<string | undefined> => {
    if (editingSpot?.id) {
      await updateSpot(editingSpot.id, spotData);
      notifications.show({ color: 'green', message: 'Spot updated.' });
      setDialogOpen(false);
      return editingSpot.id;
    } else {
      const id = await addSpot(spotData);
      notifications.show({ color: 'green', message: 'Spot added.' });
      setDialogOpen(false);
      return id;
    }
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

  if (!uid) {
    return <Text p="xl">Please sign in to view flight spots.</Text>;
  }

  const openWeatherApiKey = settings.apiKeys?.openWeatherApiKey;

  const typedSpots = spots as WithId<FlightSpot>[];

  return (
    <Box className={classes.root}>
      <Box className={classes.titleContainer}>
        <Group justify="space-between" p="sm" pb={0}>
          <Title order={2}>Flight Spot Saver</Title>
          {/* Mobile: list toggle lives in the title bar — no map overlap, standard toolbar pattern */}
          {!isDesktop && (
            <ActionIcon
              variant="subtle"
              color="blue"
              size="lg"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open spots list"
            >
              <IconList size={20} />
            </ActionIcon>
          )}
          {isDesktop && !panelOpen && (
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => setPanelOpen(true)}
              title="Open spots panel"
            >
              <IconLayoutSidebarRight size={20} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      <Box className={classes.mainContent}>
        <Box className={classes.mapWrapper} style={{ position: 'relative' }}>
          <FpvMap
            spots={spots}
            openWeatherApiKey={openWeatherApiKey}
            onContextMenu={handleContextMenu}
            flyToTarget={flyToState}
            panelOpen={isDesktop ? panelOpen : undefined}
            onTogglePanel={isDesktop ? () => setPanelOpen(!panelOpen) : undefined}
          />

          <QuickPinFab />

          {contextMenu && (
            <>
              <div
                role="presentation"
                style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
                onClick={closeContextMenu}
                onContextMenu={closeContextMenu}
              />
              <MapContextMenu
                // eslint-disable-next-line react-hooks/refs
                ref={refs.setFloating}
                style={floatingStyles}
                width={MENU_WIDTH}
                items={menuItems}
              />
            </>
          )}
        </Box>

        {isDesktop && panelOpen && (
          <Box className={classes.sidePanel}>
            <SpotsListPanel
              spots={typedSpots}
              onLocate={handleLocateFromList}
              onEdit={handleEditFromList}
              onDelete={handleDeleteFromList}
              onClose={() => setPanelOpen(false)}
            />
          </Box>
        )}
      </Box>

      {!isDesktop && (
        <Drawer
          opened={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          position="bottom"
          size="75%"
          title="Flight Spots"
        >
          <Box style={{ height: '100%' }}>
            <SpotsListPanel
              spots={typedSpots}
              onLocate={handleLocateFromList}
              onEdit={handleEditFromList}
              onDelete={handleDeleteFromList}
              onClose={() => setMobileDrawerOpen(false)}
            />
          </Box>
        </Drawer>
      )}

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

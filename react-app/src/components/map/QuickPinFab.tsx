import { useState } from 'react';
import { ActionIcon, Tooltip, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCurrentLocation } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useData } from '../../context/DataContext';

export function QuickPinFab() {
  const { addSpot } = useData();
  const [loading, setLoading] = useState(false);
  // On desktop the zoom control occupies the bottom-right (~10–75 px from map edge),
  // so the FAB needs more clearance. On mobile zoom is hidden; 16 px is the standard
  // safe-area FAB margin per iOS HIG / Material Design.
  const isMobile = useMediaQuery('(max-width: 48em)', true);

  const handlePin = () => {
    if (loading || !navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        try {
          await addSpot({
            name: `Spot — ${date}`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            comments: '',
            category: '',
            tags: [],
          });
          notifications.show({
            color: 'teal',
            message: navigator.onLine
              ? 'Spot saved!'
              : 'Spot saved — photo can be added when back online.',
          });
        } catch {
          notifications.show({ color: 'red', message: 'Failed to save spot.' });
        } finally {
          setLoading(false);
        }
      },
      () => {
        notifications.show({ color: 'orange', message: 'Could not get your location. Check GPS permissions.' });
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <Tooltip label="Pin my location" position="left" withinPortal>
      <ActionIcon
        size="xl"
        radius="xl"
        variant="filled"
        color="teal"
        style={{
          position: 'absolute',
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : 90,
          right: 16,
          zIndex: 999,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
        onClick={handlePin}
        aria-label="Quick pin — save current GPS location as a new spot"
      >
        {loading
          ? <Loader size="xs" color="white" type="dots" />
          : <IconCurrentLocation size={22} />
        }
      </ActionIcon>
    </Tooltip>
  );
}

import { useState, useMemo } from 'react';
import {
  ActionIcon,
  Box,
  Grid,
  Text,
  Title,
  Group,
  Loader,
  Tooltip,
  Button,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendar, IconDatabaseImport } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useData } from '../context/DataContext';
import type { FlightInfo as FlightInfoType } from '../types';
import AddFlightForm from '../components/AddFlightForm';
import FlightTable from '../components/FlightTable';
import FlightStats from '../components/FlightStats';

const isDev = import.meta.env.DEV;

export default function FlightInfo() {
  const { flights, flightsLoading, addFlight, updateFlight, deleteFlight } = useData();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { default: flights } = await import('../dev/test-flights.json');
      for (const flight of flights) {
        await addFlight(flight as FlightInfoType);
      }
      notifications.show({ color: 'green', message: `${flights.length} test flights added.` });
    } catch {
      notifications.show({ color: 'red', message: 'Seeding failed.' });
    } finally {
      setSeeding(false);
    }
  };
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = async (flight: Omit<FlightInfoType, 'id'>) => {
    await addFlight(flight);
    notifications.show({ color: 'green', message: 'Flight added.' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFlight(id);
      notifications.show({ color: 'green', message: 'Flight deleted.' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to delete flight. Please try again.' });
    }
  };

  const handleUpdate = async (id: string, data: Partial<Omit<FlightInfoType, 'id'>>) => {
    await updateFlight(id, data);
    notifications.show({ color: 'green', message: 'Flight updated.' });
  };

  const flightCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    flights.forEach(f => {
      if (f.date) {
        const d = f.date.split('T')[0];
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [flights]);

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Flight Log</Title>
        {isDev && (
          <Tooltip label="Seeds full test dataset (dev only)">
            <Button
              size="xs"
              variant="light"
              color="grape"
              leftSection={<IconDatabaseImport size={14} />}
              loading={seeding}
              onClick={handleSeed}
            >
              Seed test data
            </Button>
          </Tooltip>
        )}
      </Group>

      {flightsLoading ? (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      ) : (
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <AddFlightForm onAdd={handleAdd} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Box mb="md">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                renderDay={(dateStr) => {
                  const key = dateStr.split('T')[0];
                  const count = flightCountByDate[key] ?? 0;
                  const day = new Date(dateStr).getUTCDate();
                  const bg =
                    count === 0 ? 'transparent'
                    : count === 1 ? 'rgba(34, 139, 230, 0.20)'
                    : count === 2 ? 'rgba(34, 139, 230, 0.45)'
                    :               'rgba(34, 139, 230, 0.72)';
                  return (
                    <Tooltip
                      label={`${count} flight${count !== 1 ? 's' : ''}`}
                      disabled={count === 0}
                      withArrow
                    >
                      <div style={{ width: '100%', height: '100%', borderRadius: 4, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {day}
                      </div>
                    </Tooltip>
                  );
                }}
              />
              <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">
                  {selectedDate ? `Showing flights for ${selectedDate}` : 'Showing all flights'}
                </Text>
                {selectedDate !== today && (
                  <Tooltip label="Jump to today">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setSelectedDate(today)}
                      aria-label="Jump to today"
                    >
                      <IconCalendar size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {selectedDate && (
                  <Text
                    size="sm"
                    c="blue"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setSelectedDate(null)}
                  >
                    Show all
                  </Text>
                )}
              </Group>
            </Box>
            <FlightTable
              flights={flights}
              selectedDate={selectedDate}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          </Grid.Col>

          {flights.length > 0 && (
            <Grid.Col span={{ base: 12 }}>
              <Title order={4} mb="sm" mt="xs">Statistics</Title>
              <FlightStats flights={flights} />
            </Grid.Col>
          )}
        </Grid>
      )}
    </Box>
  );
}

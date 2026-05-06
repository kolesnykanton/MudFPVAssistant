import { useState, useMemo } from 'react';
import {
  ActionIcon,
  Box,
  Grid,
  Text,
  Title,
  Group,
  Loader,
  Indicator,
  Tooltip,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useData } from '../context/DataContext';
import type { FlightInfo as FlightInfoType } from '../types';
import AddFlightForm from '../components/AddFlightForm';
import FlightTable from '../components/FlightTable';
import FlightStats from '../components/FlightStats';

export default function FlightInfo() {
  const { flights, flightsLoading, addFlight, updateFlight, deleteFlight } = useData();
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
      <Title order={2} mb="lg">Flight Log</Title>

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
                  return (
                    <Indicator size={6} color="blue" offset={-2} disabled={count === 0}>
                      <div>{day}</div>
                    </Indicator>
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

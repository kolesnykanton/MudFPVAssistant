import { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Text,
  Title,
  Group,
  Loader,
  Indicator,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useUserCollection } from '../hooks/useUserCollection';
import type { FlightInfo as FlightInfoType } from '../types';
import AddFlightForm from '../components/AddFlightForm';
import FlightTable from '../components/FlightTable';
import FlightStats from '../components/FlightStats';

export default function FlightInfo() {
  const { items: flights, loading, add, remove } = useUserCollection<FlightInfoType>('FlightInfos');
  // Mantine 9 DatePicker uses string (ISO date) for value
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const handleAdd = async (flight: Omit<FlightInfoType, 'id'>) => {
    await add(flight);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  // Compute flight counts by date string "YYYY-MM-DD"
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

      {loading ? (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      ) : (
        <Grid gap="lg">
          {/* Add flight form */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <AddFlightForm onAdd={handleAdd} />
          </Grid.Col>

          {/* Date filter + table */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Box mb="md">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                renderDay={(dateStr) => {
                  // dateStr is an ISO string like "2024-06-15"
                  const key = dateStr.split('T')[0];
                  const count = flightCountByDate[key] ?? 0;
                  const day = new Date(dateStr).getUTCDate();
                  return (
                    <Indicator
                      size={6}
                      color="blue"
                      offset={-2}
                      disabled={count === 0}
                    >
                      <div>{day}</div>
                    </Indicator>
                  );
                }}
              />
              <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">
                  {selectedDate ? `Showing flights for ${selectedDate}` : 'Showing all flights'}
                </Text>
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
            />
          </Grid.Col>

          {/* Stats charts — visible only when there are flights */}
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

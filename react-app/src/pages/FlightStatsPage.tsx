import { Box, Button, Group, Loader, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconChartBar } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import FlightStats from '../components/FlightStats';

export default function FlightStatsPage() {
  const { flights, flightsLoading } = useData();

  return (
    <Box>
      <Group mb="lg" align="center">
        <Button component={Link} to="/flights" variant="subtle" leftSection={<IconArrowLeft size={16} />} size="sm" px="xs">
          Flights
        </Button>
        <Group gap="xs" align="flex-end">
          <IconChartBar size={22} style={{ color: 'var(--mantine-color-blue-4)' }} />
          <Box>
            <Title order={2} style={{ lineHeight: 1 }}>Flight Statistics</Title>
            {!flightsLoading && (
              <Text size="xs" c="dimmed" mt={2}>{flights.length} flights logged</Text>
            )}
          </Box>
        </Group>
      </Group>
      {flightsLoading ? (
        <Group justify="center" mt="xl"><Loader /></Group>
      ) : flights.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">No flight data yet. Log some flights first.</Text>
      ) : (
        <FlightStats flights={flights} />
      )}
    </Box>
  );
}

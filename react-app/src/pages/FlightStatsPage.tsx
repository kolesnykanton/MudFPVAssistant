import { Box, Button, Group, Loader, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
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
        <Title order={2}>Statistics</Title>
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

import { Box, Button, Group, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
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
        <Stack gap="lg">
          {/* KPI card row skeleton */}
          <Group gap="sm" wrap="wrap">
            {Array.from({ length: 9 }, (_, i) => (
              <Paper key={i} withBorder px="md" py="sm" radius="sm"
                style={{ flex: '1 1 150px', minWidth: 130 }}>
                <Group gap="xs" mb={4}>
                  <Skeleton circle height={14} />
                  <Skeleton height={10} width={70} radius="xl" />
                </Group>
                <Skeleton height={22} width={80} radius="xl" mt={4} />
              </Paper>
            ))}
          </Group>
          {/* Heatmap skeleton */}
          <Paper withBorder p="md" radius="md">
            <Skeleton height={14} width={120} radius="xl" mb="sm" />
            <Skeleton height={100} radius="sm" />
          </Paper>
          {/* Two chart skeletons */}
          <Group gap="lg" wrap="wrap">
            <Paper withBorder p="md" radius="md" style={{ flex: '1 1 300px' }}>
              <Skeleton height={14} width={140} radius="xl" mb="sm" />
              <Skeleton height={280} radius="sm" />
            </Paper>
            <Paper withBorder p="md" radius="md" style={{ flex: '1 1 300px' }}>
              <Skeleton height={14} width={140} radius="xl" mb="sm" />
              <Skeleton height={280} radius="sm" />
            </Paper>
          </Group>
        </Stack>
      ) : flights.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">No flight data yet. Log some flights first.</Text>
      ) : (
        <FlightStats flights={flights} />
      )}
    </Box>
  );
}

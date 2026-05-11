import { useEffect, useState, useCallback } from 'react';
import { Card, Stack, Group, Text, Skeleton, ActionIcon, Tooltip } from '@mantine/core';
import { IconRefresh, IconChevronDown } from '@tabler/icons-react';
import { useLocationForecast } from '../../hooks/useLocationForecast';

const getWindDirectionArrow = (degrees: number): string => {
  const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round((degrees % 360) / 45) % 8;
  return directions[index];
};

export const WeatherPanel = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [expandForecast, setExpandForecast] = useState(false);

  const { data, loading, error, refetch } = useLocationForecast(
    location?.lat ?? null,
    location?.lng ?? null
  );

  // Get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(false);
        },
        () => {
          setLocationError(true);
        }
      );
    } else {
      setLocationError(true);
    }
  }, []);

  // Refresh cooldown timer
  useEffect(() => {
    if (refreshCooldown <= 0) {
      setRefreshing(false);
      return;
    }

    const timer = setTimeout(() => setRefreshCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [refreshCooldown]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshCooldown(30);
    refetch();
  }, [refetch]);

  if (locationError) {
    return (
      <Card
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '8px',
          zIndex: 999,
          maxWidth: '300px',
        }}
        shadow="sm"
        padding="md"
      >
        <Text size="sm" c="dimmed">
          Enable location to see forecast
        </Text>
      </Card>
    );
  }

  if (loading || !location) {
    return (
      <Card
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '8px',
          zIndex: 999,
          maxWidth: '300px',
        }}
        shadow="sm"
        padding="md"
      >
        <Stack gap="xs">
          <Skeleton height={20} />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '8px',
          zIndex: 999,
          maxWidth: '300px',
        }}
        shadow="sm"
        padding="md"
      >
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Weather unavailable
          </Text>
          <Tooltip label={refreshCooldown > 0 ? `Cooldown: ${refreshCooldown}s` : 'Refresh'}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              loading={refreshing}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const windArrow = getWindDirectionArrow(data.windDir);

  return (
    <Card
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '8px',
        zIndex: 999,
        maxWidth: '280px',
      }}
      shadow="sm"
      padding="md"
    >
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between" align="center">
          <Text fw={500} size="sm">
            Weather
          </Text>
          <Tooltip
            label={
              refreshCooldown > 0 ? `Cooldown: ${refreshCooldown}s` : 'Refresh forecast'
            }
          >
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              loading={refreshing}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card.Section>

      <Stack gap="sm" mt="sm">
        {/* Current conditions */}
        <Group grow>
          <div>
            <Text size="xs" c="dimmed">
              Temperature
            </Text>
            <Text fw={500}>{data.temp.toFixed(1)}°C</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Cloud
            </Text>
            <Text fw={500}>{data.cloudCover.toFixed(0)}%</Text>
          </div>
        </Group>

        <Group grow>
          <div>
            <Text size="xs" c="dimmed">
              Wind
            </Text>
            <Group gap={4}>
              <Text fw={500}>{data.windSpeed.toFixed(1)}</Text>
              <span style={{ fontSize: '16px' }}>{windArrow}</span>
            </Group>
            <Text size="xs" c="dimmed">
              Gusts: {data.windGusts.toFixed(1)} km/h
            </Text>
          </div>
        </Group>

        <div>
          <Text size="xs" c="dimmed">
            Rain Probability
          </Text>
          <Text fw={500} c={data.precipProb > 50 ? 'orange' : undefined}>
            {data.precipProb.toFixed(0)}%
          </Text>
        </div>

        {/* Forecast toggle + collapse */}
        {data.nextHours.length > 0 && (
          <>
            <Group
              gap={6}
              align="center"
              onClick={() => setExpandForecast(!expandForecast)}
              style={{ cursor: 'pointer' }}
            >
              <ActionIcon
                variant="subtle"
                size="sm"
                style={{
                  transform: expandForecast ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <IconChevronDown size={16} />
              </ActionIcon>
              <Text size="xs" fw={500}>
                Next Hours
              </Text>
            </Group>

            {expandForecast && (
              <Stack gap={4}>
                {data.nextHours.map((hour) => (
                  <Group justify="space-between" key={hour.time} grow>
                    <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {hour.time}
                    </Text>
                    <Group gap={8} justify="flex-end">
                      <Text size="sm" c={hour.precipProbability > 50 ? 'orange' : undefined}>
                        🌧 {hour.precipProbability.toFixed(0)}%
                      </Text>
                      <Text size="sm">
                        {getWindDirectionArrow(hour.windDir)} {hour.windSpeed.toFixed(0)}
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
};

import { useEffect, useState, useCallback } from 'react';
import { Card, Stack, Group, Text, Skeleton, ActionIcon, Tooltip, Badge, Collapse, Divider } from '@mantine/core';
import {
  IconRefresh,
  IconChevronDown,
  IconWind,
  IconThermometer,
  IconCloud,
  IconDroplets,
  IconCloudRain,
  IconX,
} from '@tabler/icons-react';
import { useLocationForecast } from '../../hooks/useLocationForecast';

const WIND_DIRECTION_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const getWindArrow = (degrees: number): string => {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  return arrows[Math.round((degrees % 360) / 45) % 8];
};

const getWindLabel = (degrees: number): string =>
  WIND_DIRECTION_LABELS[Math.round((degrees % 360) / 45) % 8];

const getWindCondition = (speed: number): { color: string; label: string } => {
  if (speed > 10) return { color: 'red', label: 'Strong' };
  if (speed > 6) return { color: 'orange', label: 'Moderate' };
  return { color: 'green', label: 'Calm' };
};

const getFlyCondition = (
  windSpeed: number,
  precipProb: number
): { color: string; label: string } => {
  if (precipProb > 50 || windSpeed > 10) return { color: 'red', label: 'Poor' };
  if (precipProb > 25 || windSpeed > 6) return { color: 'orange', label: 'Caution' };
  return { color: 'teal', label: 'Good to Fly' };
};

const MetricRow = ({
  icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueColor?: string;
}) => (
  <Group justify="space-between" align="flex-start" wrap="nowrap">
    <Group gap={6} wrap="nowrap">
      <Text c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
        {icon}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
    <Stack gap={0} align="flex-end">
      <Text size="sm" fw={500} c={valueColor}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed">
          {sub}
        </Text>
      )}
    </Stack>
  </Group>
);

const PANEL_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '75px',
  zIndex: 999,
  width: '220px',
};

const COLLAPSED_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '75px',
  zIndex: 999,
  width: 'auto',
};

export const WeatherPanel = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [forecastOpen, setForecastOpen] = useState(false);

  const { data, loading, error, refetch } = useLocationForecast(
    location?.lat ?? null,
    location?.lng ?? null
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true)
    );
  }, []);

  useEffect(() => {
    if (refreshCooldown <= 0) {
      setRefreshing(false);
      return;
    }
    const t = setTimeout(() => setRefreshCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [refreshCooldown]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshCooldown(30);
    refetch();
  }, [refetch]);

  if (locationError) {
    return (
      <Card style={PANEL_STYLE} shadow="sm" padding="xs" radius="md">
        <Text size="xs" c="dimmed">
          Enable location for forecast
        </Text>
      </Card>
    );
  }

  if (loading || !location) {
    return (
      <Card style={PANEL_STYLE} shadow="sm" padding="sm" radius="md">
        <Stack gap="xs">
          <Skeleton height={14} radius="sm" />
          <Skeleton height={14} radius="sm" />
          <Skeleton height={14} radius="sm" width="70%" />
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={PANEL_STYLE} shadow="sm" padding="xs" radius="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Weather unavailable
          </Text>
          <Tooltip label={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'Retry'}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              loading={refreshing}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
    );
  }

  if (!data) return null;

  const windCondition = getWindCondition(data.windSpeed);
  const flyCondition = getFlyCondition(data.windSpeed, data.precipProb);
  const windArrow = getWindArrow(data.windDir);
  const windDirLabel = getWindLabel(data.windDir);

  // Collapsed pill — just temp + wind + expand button
  if (collapsed) {
    return (
      <Card style={COLLAPSED_STYLE} shadow="sm" padding="6px 10px" radius="xl">
        <Group gap={8} wrap="nowrap" align="center">
          <Badge size="xs" color={flyCondition.color} variant="dot" style={{ paddingLeft: 4 }}>
            {flyCondition.label}
          </Badge>
          <Text size="sm" fw={600}>
            {data.temp.toFixed(0)}°
          </Text>
          <Text size="sm" c={windCondition.color}>
            {windArrow} {data.windSpeed.toFixed(1)}
            <Text span size="xs" c="dimmed">
              {' '}
              m/s
            </Text>
          </Text>
          <ActionIcon
            variant="subtle"
            size="xs"
            onClick={() => setCollapsed(false)}
            title="Expand weather"
          >
            <IconChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
          </ActionIcon>
        </Group>
      </Card>
    );
  }

  return (
    <Card style={PANEL_STYLE} shadow="sm" padding="sm" radius="md">
      {/* Header */}
      <Group justify="space-between" align="center" mb={8}>
        <Group gap={6} align="center">
          <Text fw={600} size="sm">
            Weather
          </Text>
          <Badge size="xs" color={flyCondition.color} variant="light">
            {flyCondition.label}
          </Badge>
        </Group>
        <Group gap={4}>
          <Tooltip label={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'Refresh'}>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              loading={refreshing}
            >
              <IconRefresh size={13} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Collapse">
            <ActionIcon variant="subtle" size="xs" onClick={() => setCollapsed(true)}>
              <IconX size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Stack gap={6}>
        <MetricRow
          icon={<IconThermometer size={13} />}
          label="Temperature"
          value={`${data.temp.toFixed(1)}°C`}
        />

        <MetricRow
          icon={<IconWind size={13} />}
          label="Wind"
          value={
            <span style={{ color: `var(--mantine-color-${windCondition.color}-6)` }}>
              {windArrow} {data.windSpeed.toFixed(1)} m/s{' '}
              <Text span size="xs" c="dimmed">
                {windDirLabel}
              </Text>
            </span>
          }
          sub={`Gusts ${data.windGusts.toFixed(1)} m/s`}
        />

        <MetricRow
          icon={<IconCloud size={13} />}
          label="Cloud cover"
          value={`${data.cloudCover.toFixed(0)}%`}
        />

        <MetricRow
          icon={<IconDroplets size={13} />}
          label="Rain chance"
          value={`${data.precipProb.toFixed(0)}%`}
          valueColor={data.precipProb > 50 ? 'orange' : data.precipProb > 25 ? 'yellow' : undefined}
        />

        {/* Hourly forecast toggle */}
        {data.nextHours.length > 0 && (
          <>
            <Divider my={2} />
            <Group
              gap={4}
              align="center"
              onClick={() => setForecastOpen((o) => !o)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <IconChevronDown
                size={13}
                style={{
                  transform: forecastOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.18s',
                  color: 'var(--mantine-color-dimmed)',
                }}
              />
              <Text size="xs" c="dimmed">
                Next hours
              </Text>
            </Group>

            <Collapse expanded={forecastOpen}>
              <Stack gap={4} mt={2}>
                {data.nextHours.map((h) => (
                  <Group key={h.time} justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed" ff="monospace">
                      {h.time}
                    </Text>
                    <Group gap={8} wrap="nowrap">
                      <Group gap={2} wrap="nowrap">
                        <IconCloudRain
                          size={11}
                          style={{
                            color:
                              h.precipProbability > 50
                                ? 'var(--mantine-color-orange-6)'
                                : 'var(--mantine-color-dimmed)',
                          }}
                        />
                        <Text
                          size="xs"
                          c={h.precipProbability > 50 ? 'orange' : 'dimmed'}
                        >
                          {h.precipProbability.toFixed(0)}%
                        </Text>
                      </Group>
                      <Text size="xs" c={getWindCondition(h.windSpeed).color}>
                        {getWindArrow(h.windDir)} {h.windSpeed.toFixed(0)}
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>
    </Card>
  );
};

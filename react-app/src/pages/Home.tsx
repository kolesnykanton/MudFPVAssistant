import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import {
  IconBattery2,
  IconClock,
  IconMapPin,
  IconPlane,
  IconPlaneTilt,
  IconSettings,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../hooks/useSettings';
import { useCountUp } from '../hooks/useCountUp';
import { CATEGORY_COLORS } from '../types';

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
}

export default function Home() {
  const navigate = useNavigate();
  const { flights, spots, flightsLoading, spotsLoading } = useData();
  const { settings, loading: settingsLoading } = useSettings();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const apiKey = settings.apiKeys?.openWeatherApiKey;

  useEffect(() => {
    if (!apiKey || settingsLoading) return;

    let cancelled = false;
    const controller = new AbortController();

    /* eslint-disable react-hooks/set-state-in-effect */
    setWeatherLoading(true);
    setWeatherError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
          const data: WeatherData = await res.json();
          if (!cancelled) setWeather(data);
        } catch (err) {
          if (cancelled) return;
          setWeatherError(err instanceof Error ? err.message : 'Failed to load weather');
        } finally {
          if (!cancelled) setWeatherLoading(false);
        }
      },
      (geoErr) => {
        if (!cancelled) {
          setWeatherError(`Location access denied: ${geoErr.message}`);
          setWeatherLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiKey, settingsLoading]);

  const totalFlightsRaw = flights.length;
  const totalMahRaw = flights.reduce((sum, f) => sum + (f.usedMah ?? 0), 0);
  const uniqueDronesRaw = new Set(flights.map(f => f.name)).size;

  const animTotalFlights = useCountUp(totalFlightsRaw);
  const animTotalMah = useCountUp(totalMahRaw);
  const animUniqueDrones = useCountUp(uniqueDronesRaw);
  const animSpots = useCountUp(spots.length);

  const statsCards = [
    { title: 'Total Flights', value: animTotalFlights, icon: <IconPlaneTilt size={40} color="var(--mantine-color-blue-6)" /> },
    { title: 'Total mAh', value: animTotalMah.toLocaleString(), icon: <IconBattery2 size={40} color="var(--mantine-color-green-6)" /> },
    { title: 'Unique Drones', value: animUniqueDrones, icon: <IconPlane size={40} color="var(--mantine-color-yellow-6)" /> },
  ];

  const recentFlights = flights.slice(0, 5);
  const spotById = useMemo(() => new Map(spots.map(s => [s.id, s])), [spots]);

  const isLoading = flightsLoading || spotsLoading;

  return (
    <Box>
      <Title order={2} mb="lg">Dashboard</Title>

      {isLoading ? (
        <Grid gap="lg">
          {/* KPI tile skeletons */}
          {[0, 1, 2, 3].map(i => (
            <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder shadow="sm" radius="md" style={{ textAlign: 'center' }} py="lg">
                <Skeleton circle height={40} mx="auto" />
                <Skeleton height={12} width={80} mx="auto" mt="xs" radius="xl" />
                <Skeleton height={24} width={60} mx="auto" mt={6} radius="xl" />
              </Card>
            </Grid.Col>
          ))}
          {/* Recent flights skeleton */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder shadow="sm" radius="md">
              <Group justify="space-between" mb="sm">
                <Skeleton height={16} width={120} radius="xl" />
                <Skeleton height={12} width={60} radius="xl" />
              </Group>
              <Stack gap="md" mt="xs">
                {[0, 1, 2, 3, 4].map(i => (
                  <Group key={i} gap="sm" wrap="nowrap">
                    <Skeleton circle height={26} style={{ flexShrink: 0 }} />
                    <Box style={{ flex: 1 }}>
                      <Skeleton height={12} width={`${60 + (i % 3) * 15}%`} radius="xl" />
                      <Skeleton height={10} width={`${40 + (i % 2) * 20}%`} mt={6} radius="xl" />
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
          {/* Weather skeleton */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder shadow="sm" radius="md">
              <Skeleton height={16} width={80} radius="xl" mb="sm" />
              <Group gap="md">
                <Skeleton circle height={64} />
                <Box style={{ flex: 1 }}>
                  <Skeleton height={20} width="60%" radius="xl" />
                  <Skeleton height={14} width="80%" mt={8} radius="xl" />
                  <Skeleton height={12} width="70%" mt={6} radius="xl" />
                </Box>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      ) : (
        <Grid gap="lg">
          {/* KPI tiles */}
          {statsCards.map((card) => (
            <Grid.Col key={card.title} span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder shadow="sm" radius="md" style={{ textAlign: 'center' }} py="lg">
                {card.icon}
                <Text size="sm" c="dimmed" mt="xs">{card.title}</Text>
                <Title order={3} fw={700}>{card.value}</Title>
              </Card>
            </Grid.Col>
          ))}

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder shadow="sm" radius="md" style={{ textAlign: 'center' }} py="lg">
              <IconMapPin size={40} color="var(--mantine-color-red-6)" />
              <Text size="sm" c="dimmed" mt="xs">Flight Spots</Text>
              <Title order={3} fw={700}>{animSpots}</Title>
              <Button variant="outline" size="xs" mt="xs" onClick={() => navigate('/spots')}>
                View Map
              </Button>
            </Card>
          </Grid.Col>

          {/* Recent flights */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder shadow="sm" radius="md">
              <Group justify="space-between" mb="sm">
                <Title order={5}>Recent Flights</Title>
                <Group gap="xs">
                  <Anchor component={Link} to="/flights/stats" size="xs" c="dimmed">
                    View statistics →
                  </Anchor>
                  <Anchor component={Link} to="/flights" size="xs">
                    View all →
                  </Anchor>
                </Group>
              </Group>
              {recentFlights.length === 0 ? (
                <Text c="dimmed" size="sm">No flights logged yet.</Text>
              ) : (
                <Timeline
                  active={recentFlights.length - 1}
                  bulletSize={26}
                  lineWidth={2}
                  mt="xs"
                >
                  {recentFlights.map(f => {
                    const spot = f.spotId ? spotById.get(f.spotId) : undefined;
                    const categoryColor = spot?.category ? (CATEGORY_COLORS[spot.category] ?? undefined) : undefined;
                    const batColor =
                      f.batType === 'LiPo' ? 'var(--mantine-color-orange-5)'
                      : f.batType === 'LiIon' ? 'var(--mantine-color-blue-5)'
                      : 'var(--mantine-color-gray-5)';
                    const dateLabel = f.date
                      ? new Date(f.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—';
                    return (
                      <Timeline.Item
                        key={f.id}
                        bullet={<IconBattery2 size={13} style={{ color: batColor }} />}
                        title={
                          <Group gap={6} wrap="nowrap">
                            <Text fw={600} size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{dateLabel}</Text>
                          </Group>
                        }
                      >
                        <Group gap={4} wrap="wrap" mt={2}>
                          {(spot?.name ?? f.location) && (
                            <Group gap={3} wrap="nowrap">
                              <IconMapPin size={11} style={{ color: categoryColor ?? 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
                              <Text size="xs" c="dimmed">{spot?.name ?? f.location}</Text>
                            </Group>
                          )}
                          {f.flightTime && (
                            <Group gap={3} wrap="nowrap">
                              <IconClock size={11} style={{ flexShrink: 0 }} />
                              <Text size="xs" c="dimmed">{f.flightTime}</Text>
                            </Group>
                          )}
                          {f.usedMah != null && (
                            <Text size="xs" c="dimmed">{f.usedMah} mAh</Text>
                          )}
                        </Group>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              )}
            </Card>
          </Grid.Col>

          {/* Weather */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder shadow="sm" radius="md">
              <Title order={5} mb="sm">Weather</Title>
              <Box mih={140}>
                {settingsLoading || weatherLoading ? (
                  <Group gap="md">
                    <Skeleton circle height={64} />
                    <Box style={{ flex: 1 }}>
                      <Skeleton height={20} width="60%" radius="xl" />
                      <Skeleton height={14} width="80%" mt={8} radius="xl" />
                      <Skeleton height={12} width="70%" mt={6} radius="xl" />
                    </Box>
                  </Group>
                ) : !apiKey ? (
                  <Stack gap="sm">
                    <Text c="dimmed" size="sm">
                      Configure OpenWeather API key in Settings to see local weather.
                    </Text>
                    <Button variant="outline" size="xs" leftSection={<IconSettings size={14} />} onClick={() => navigate('/settings')}>
                      Settings
                    </Button>
                  </Stack>
                ) : weatherError ? (
                  <Text c="red" size="sm">{weatherError}</Text>
                ) : weather ? (
                  <Group gap="md">
                    {weather.weather[0]?.icon && (
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                        alt={weather.weather[0].description}
                        style={{ width: 64, height: 64 }}
                      />
                    )}
                    <Box>
                      <Title order={4}>{weather.name}</Title>
                      <Text style={{ textTransform: 'capitalize' }}>{weather.weather[0]?.description}</Text>
                      <Text size="sm" c="dimmed">
                        {Math.round(weather.main.temp)}°C · {weather.main.humidity}% · {weather.wind.speed} m/s
                      </Text>
                    </Box>
                  </Group>
                ) : null}
              </Box>
            </Card>
          </Grid.Col>
        </Grid>
      )}
    </Box>
  );
}

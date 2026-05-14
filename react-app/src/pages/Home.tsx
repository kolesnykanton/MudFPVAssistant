import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBattery2,
  IconMapPin,
  IconPlane,
  IconPlaneTilt,
  IconSettings,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../hooks/useSettings';
import FlightCard from '../components/flights/FlightCard';

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

  const totalFlights = flights.length;
  const totalMah = flights.reduce((sum, f) => sum + (f.usedMah ?? 0), 0);
  const uniqueDrones = new Set(flights.map(f => f.name)).size;

  const statsCards = [
    { title: 'Total Flights', value: totalFlights, icon: <IconPlaneTilt size={40} color="var(--mantine-color-blue-6)" /> },
    { title: 'Total mAh', value: totalMah.toLocaleString(), icon: <IconBattery2 size={40} color="var(--mantine-color-green-6)" /> },
    { title: 'Unique Drones', value: uniqueDrones, icon: <IconPlane size={40} color="var(--mantine-color-yellow-6)" /> },
  ];

  const recentFlights = flights.slice(0, 5);

  const isLoading = flightsLoading || spotsLoading;

  return (
    <Box>
      <Title order={2} mb="lg">Dashboard</Title>

      {isLoading ? (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
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
              <Title order={3} fw={700}>{spots.length}</Title>
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
                <Stack gap="xs">
                  {recentFlights.map(f => (
                    <FlightCard
                      key={f.id}
                      flight={f}
                      spot={spots.find(s => s.id === f.spotId)}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      readOnly
                    />
                  ))}
                </Stack>
              )}
            </Card>
          </Grid.Col>

          {/* Weather */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder shadow="sm" radius="md">
              <Title order={5} mb="sm">Weather</Title>
              <Box mih={140}>
                {settingsLoading || weatherLoading ? (
                  <Group gap="xs">
                    <Loader size="xs" />
                    <Text c="dimmed">Loading weather…</Text>
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

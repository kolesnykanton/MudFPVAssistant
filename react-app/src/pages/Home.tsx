import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import PlaceIcon from '@mui/icons-material/Place';
import SettingsIcon from '@mui/icons-material/Settings';
import { useUserCollection } from '../hooks/useUserCollection';
import { useSettings } from '../hooks/useSettings';
import type { FlightInfo, FlightSpot } from '../types';

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
}

export default function Home() {
  const navigate = useNavigate();
  const { items: flights, loading: flightsLoading } = useUserCollection<FlightInfo>('FlightInfos');
  const { items: spots, loading: spotsLoading } = useUserCollection<FlightSpot>('FlightSpots');
  const { settings, loading: settingsLoading } = useSettings();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const apiKey = settings.apiKeys?.openWeatherApiKey;

  useEffect(() => {
    if (!apiKey || settingsLoading) return;

    setWeatherLoading(true);
    setWeatherError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
          );
          if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
          const data: WeatherData = await res.json();
          setWeather(data);
        } catch (err) {
          setWeatherError(err instanceof Error ? err.message : 'Failed to load weather');
        } finally {
          setWeatherLoading(false);
        }
      },
      (geoErr) => {
        setWeatherError(`Location access denied: ${geoErr.message}`);
        setWeatherLoading(false);
      }
    );
  }, [apiKey, settingsLoading]);

  const totalFlights = flights.length;
  const totalMah = flights.reduce((sum, f) => sum + (f.usedMah ?? 0), 0);
  const uniqueDrones = new Set(flights.map(f => f.name)).size;

  const statsCards = [
    {
      title: 'Total Flights',
      value: totalFlights,
      icon: <FlightTakeoffIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Total mAh',
      value: totalMah.toLocaleString(),
      icon: <BatteryChargingFullIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    },
    {
      title: 'Unique Drones',
      value: uniqueDrones,
      icon: <AirplanemodeActiveIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
    },
  ];

  const isLoading = flightsLoading || spotsLoading;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Stats cards */}
          {statsCards.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  {card.icon}
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Flight Spots card */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PlaceIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                  Flight Spots
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {spots.length}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/map-spot-save')}
                >
                  View Map
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Weather widget */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weather
                </Typography>

                {settingsLoading || weatherLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Loading weather…</Typography>
                  </Box>
                ) : !apiKey ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography color="text.secondary">
                      Configure OpenWeather API key in Settings to see local weather.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </Button>
                  </Box>
                ) : weatherError ? (
                  <Typography color="error">{weatherError}</Typography>
                ) : weather ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {weather.weather[0]?.icon && (
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                        alt={weather.weather[0].description}
                        style={{ width: 64, height: 64 }}
                      />
                    )}
                    <Box>
                      <Typography variant="h5">{weather.name}</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {weather.weather[0]?.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Temp: {Math.round(weather.main.temp)}°C &nbsp;|&nbsp;
                        Humidity: {weather.main.humidity}% &nbsp;|&nbsp;
                        Wind: {weather.wind.speed} m/s
                      </Typography>
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

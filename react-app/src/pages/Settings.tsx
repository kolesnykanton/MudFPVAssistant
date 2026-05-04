import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack } from '@mui/material';
import { useSettings } from '../hooks/useSettings';

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');

  useEffect(() => {
    setOpenWeatherKey(settings.apiKeys?.openWeatherApiKey || '');
    setGoogleMapsKey(settings.apiKeys?.googleApiKey || '');
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      apiKeys: { openWeatherApiKey: openWeatherKey, googleApiKey: googleMapsKey }
    });
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>
      <Stack spacing={3} sx={{ maxWidth: 500 }}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>OpenWeather API Key</Typography>
          <TextField
            fullWidth
            value={openWeatherKey}
            onChange={e => setOpenWeatherKey(e.target.value)}
            onBlur={handleSave}
            placeholder="API key"
            size="small"
          />
        </Paper>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Google Maps API Key</Typography>
          <TextField
            fullWidth
            value={googleMapsKey}
            onChange={e => setGoogleMapsKey(e.target.value)}
            onBlur={handleSave}
            placeholder="API key"
            size="small"
          />
        </Paper>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </Stack>
    </Box>
  );
}

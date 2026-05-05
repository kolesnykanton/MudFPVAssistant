import { useState, useEffect } from 'react';
import { Box, Paper, Title, Text, TextInput, Button, Stack } from '@mantine/core';
import { useSettings } from '../hooks/useSettings';

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpenWeatherKey(settings.apiKeys?.openWeatherApiKey || '');
    setGoogleMapsKey(settings.apiKeys?.googleApiKey || '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      apiKeys: { openWeatherApiKey: openWeatherKey, googleApiKey: googleMapsKey }
    });
  };

  if (loading) return <Text p="xl">Loading...</Text>;

  return (
    <Box p="lg">
      <Title order={2} mb="lg">Settings</Title>
      <Stack gap="lg" maw={500}>
        <Paper withBorder p="lg" radius="md">
          <Text fw={500} mb="sm">OpenWeather API Key</Text>
          <TextInput
            value={openWeatherKey}
            onChange={e => setOpenWeatherKey(e.target.value)}
            placeholder="API key"
            size="sm"
          />
        </Paper>
        <Paper withBorder p="lg" radius="md">
          <Text fw={500} mb="sm">Google Maps API Key</Text>
          <TextInput
            value={googleMapsKey}
            onChange={e => setGoogleMapsKey(e.target.value)}
            placeholder="API key"
            size="sm"
          />
        </Paper>
        <Button variant="filled" onClick={handleSave}>Save</Button>
      </Stack>
    </Box>
  );
}

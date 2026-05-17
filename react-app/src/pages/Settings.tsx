import { useState, useEffect } from 'react';
import { Box, Button, Group, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSettings } from '../hooks/useSettings';

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [tomorrowIoKey, setTomorrowIoKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpenWeatherKey(settings.apiKeys?.openWeatherApiKey || '');
    setGoogleMapsKey(settings.apiKeys?.googleApiKey || '');
    setTomorrowIoKey(settings.apiKeys?.tomorrowIoApiKey || '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        apiKeys: {
          openWeatherApiKey: openWeatherKey.trim(),
          googleApiKey: googleMapsKey.trim(),
          tomorrowIoApiKey: tomorrowIoKey.trim(),
        },
      });
      notifications.show({ color: 'green', message: 'Settings saved.' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Text p="xl">Loading...</Text>;

  return (
    <Box p="lg">
      <Title order={2} mb="lg">Settings</Title>
      <Stack gap="lg" maw={500}>
        <Paper withBorder p="lg" radius="md">
          <Text fw={500} mb="sm">OpenWeather API Key</Text>
          <PasswordInput
            value={openWeatherKey}
            onChange={e => setOpenWeatherKey(e.target.value)}
            placeholder="API key"
            size="sm"
            autoComplete="off"
          />
        </Paper>
        <Paper withBorder p="lg" radius="md">
          <Text fw={500} mb="sm">Google Maps API Key</Text>
          <PasswordInput
            value={googleMapsKey}
            onChange={e => setGoogleMapsKey(e.target.value)}
            placeholder="API key"
            size="sm"
            autoComplete="off"
          />
        </Paper>
        <Paper withBorder p="lg" radius="md">
          <Text fw={500} mb="sm">Tomorrow.io API Key</Text>
          <Text size="xs" c="dimmed" mb="xs">Enables the &quot;Forecast 6h&quot; radar overlay (±6 hours of precipitation forecast). Free tier: 500 requests/day.</Text>
          <PasswordInput
            value={tomorrowIoKey}
            onChange={e => setTomorrowIoKey(e.target.value)}
            placeholder="API key"
            size="sm"
            autoComplete="off"
          />
        </Paper>
        <Group>
          <Button variant="filled" onClick={handleSave} loading={saving}>Save</Button>
        </Group>
      </Stack>
    </Box>
  );
}

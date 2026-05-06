import { useState, useEffect } from 'react';
import { Alert, Box, Button, Group, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useSettings } from '../hooks/useSettings';

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpenWeatherKey(settings.apiKeys?.openWeatherApiKey || '');
    setGoogleMapsKey(settings.apiKeys?.googleApiKey || '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings]);

  // Auto-clear "Saved" badge after 2s
  useEffect(() => {
    if (savedAt === null) return;
    const t = window.setTimeout(() => setSavedAt(null), 2000);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateSettings({
        apiKeys: {
          openWeatherApiKey: openWeatherKey.trim(),
          googleApiKey: googleMapsKey.trim(),
        },
      });
      setSavedAt(Date.now());
    } catch {
      setSaveError('Failed to save settings. Please try again.');
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

        {saveError && (
          <Alert color="red" variant="light" withCloseButton onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        <Group>
          <Button variant="filled" onClick={handleSave} loading={saving}>Save</Button>
          {savedAt !== null && <Text c="green" size="sm">Saved.</Text>}
        </Group>
      </Stack>
    </Box>
  );
}

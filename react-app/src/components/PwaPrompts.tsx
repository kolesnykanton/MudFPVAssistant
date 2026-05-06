import { useEffect, useState } from 'react';
import { Affix, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconDownload, IconRefresh, IconX } from '@tabler/icons-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// chrome ships this; not in lib.dom because it's a draft API
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'mfa-install-dismissed';

export default function PwaPrompts() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) { console.warn('[pwa] SW registration error:', err); },
  });

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(INSTALL_DISMISSED_KEY) === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBefore);

    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const dismissInstall = () => {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setInstallEvent(null);
  };

  if (!needRefresh && !installEvent) return null;

  return (
    <Affix position={{ bottom: 16, right: 16 }} zIndex={2000}>
      <Stack gap="xs" maw={320}>
        {needRefresh && (
          <Paper withBorder shadow="md" p="sm" radius="md">
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Text size="sm">A new version is available.</Text>
              <Group gap={4} wrap="nowrap">
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => updateServiceWorker(true)}
                >
                  Reload
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  aria-label="Dismiss"
                  px={6}
                  onClick={() => setNeedRefresh(false)}
                >
                  <IconX size={14} />
                </Button>
              </Group>
            </Group>
          </Paper>
        )}
        {installEvent && (
          <Paper withBorder shadow="md" p="sm" radius="md">
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Text size="sm">Install MudFPV for quick offline access.</Text>
              <Group gap={4} wrap="nowrap">
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<IconDownload size={14} />}
                  onClick={handleInstall}
                >
                  Install
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  aria-label="Dismiss"
                  px={6}
                  onClick={dismissInstall}
                >
                  <IconX size={14} />
                </Button>
              </Group>
            </Group>
          </Paper>
        )}
      </Stack>
    </Affix>
  );
}

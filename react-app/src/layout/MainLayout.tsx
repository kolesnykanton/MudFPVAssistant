import type { ReactNode } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Text,
  ActionIcon,
  Avatar,
  Button,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMoon, IconSun, IconLogin, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import NavMenu from './NavMenu';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, loading, signIn, signOut } = useAuth();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header style={{ background: '#03173d' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="white"
            />
            <Text fw={700} c="white" size="lg">
              MudFPV Assistant
            </Text>
          </Group>

          <Group gap="xs">
            <Tooltip label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <ActionIcon onClick={() => toggleColorScheme()} variant="subtle" color="white" size="lg">
                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
            </Tooltip>

            {!loading && user && (
              <Tooltip label={user.displayName ?? user.email ?? ''}>
                <Avatar
                  src={user.photoURL ?? undefined}
                  alt={user.displayName ?? ''}
                  size="sm"
                  radius="xl"
                  style={{ cursor: 'default' }}
                />
              </Tooltip>
            )}

            {!loading && (
              user ? (
                <Tooltip label="Logout">
                  <Button
                    onClick={signOut}
                    variant="subtle"
                    color="orange"
                    leftSection={<IconLogout size={16} />}
                    size="xs"
                  >
                    Logout
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip label="Login with Google">
                  <Button
                    onClick={signIn}
                    variant="subtle"
                    color="white"
                    leftSection={<IconLogin size={16} />}
                    size="xs"
                  >
                    Sign in
                  </Button>
                </Tooltip>
              )
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ background: '#03173d' }}>
        <NavMenu onNavClick={() => { if (opened) toggle(); }} />
      </AppShell.Navbar>

      <AppShell.Main>
        {!loading && !user ? (
          <Group justify="center" mt="xl">
            <Text c="dimmed">Please sign in to continue.</Text>
          </Group>
        ) : (
          children
        )}
      </AppShell.Main>
    </AppShell>
  );
}

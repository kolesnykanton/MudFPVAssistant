import type { ReactNode } from 'react';
import {
  Anchor,
  AppShell,
  Avatar,
  Burger,
  Group,
  ActionIcon,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMoon, IconSun, IconLogin, IconLogout } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavMenu from './NavMenu';

const MAIN_CONTENT_ID = 'main-content';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, loading, signIn, signOut } = useAuth();

  const handleSignIn = () => {
    // Benign cases (popup closed, blocked → redirect) are absorbed inside signIn.
    // Anything that escapes is genuinely unexpected; surface to console rather
    // than letting it become an unhandled promise rejection.
    signIn().catch(err => console.error('[auth] sign-in failed:', err));
  };

  // Hide the navbar entirely when the user is signed out — its links go to
  // routes that just show "please sign in" anyway.
  const showNavbar = !!user;

  return (
    <>
      <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">Skip to main content</a>

      <AppShell
        header={{ height: 'calc(60px + env(safe-area-inset-top, 0px))' }}
        navbar={
          showNavbar
            ? { width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }
            : undefined
        }
        padding="md"
      >
      <AppShell.Header style={{ background: '#03173d', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group>
            {showNavbar && (
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                color="white"
                aria-label="Toggle navigation"
              />
            )}
            <Anchor
              component={Link}
              to="/"
              underline="never"
              c="white"
              fw={700}
              fz="lg"
              aria-label="MudFPV Assistant — Dashboard"
            >
              MudFPV Assistant
            </Anchor>
          </Group>

          <Group gap="xs" align="center">
            <Tooltip label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <ActionIcon
                onClick={() => toggleColorScheme()}
                variant="subtle"
                color="white"
                size="lg"
                aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
            </Tooltip>

            {!loading && user && (
              <Avatar
                src={user.photoURL ?? undefined}
                alt=""
                size="sm"
                radius="xl"
                aria-hidden="true"
              />
            )}

            {!loading && (
              user ? (
                <Tooltip label="Logout">
                  <ActionIcon
                    onClick={signOut}
                    variant="subtle"
                    color="orange"
                    size="lg"
                    aria-label="Logout"
                  >
                    <IconLogout size={18} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Tooltip label="Sign in with Google">
                  <ActionIcon
                    onClick={handleSignIn}
                    variant="subtle"
                    color="white"
                    size="lg"
                    aria-label="Sign in with Google"
                  >
                    <IconLogin size={18} />
                  </ActionIcon>
                </Tooltip>
              )
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {showNavbar && (
        <AppShell.Navbar p="md" style={{ background: '#03173d', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <NavMenu onNavClick={() => { if (opened) toggle(); }} />
        </AppShell.Navbar>
      )}

      <AppShell.Main id={MAIN_CONTENT_ID}>
        {!loading && !user ? (
          <Group justify="center" mt="xl">
            <Text c="dimmed">Please sign in to continue.</Text>
          </Group>
        ) : (
          children
        )}
      </AppShell.Main>
      </AppShell>
    </>
  );
}

import type { ReactNode } from 'react';
import {
  Anchor,
  AppShell,
  Avatar,
  Button,
  Group,
  ActionIcon,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMoon, IconSun, IconLogin, IconLogout } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavMenu from './NavMenu';
import BottomTabBar from './BottomTabBar';

const MAIN_CONTENT_ID = 'main-content';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, loading, signIn, signOut } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)', true);

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
            ? { width: 220, breakpoint: 'sm', collapsed: { mobile: true } }
            : undefined
        }
        footer={
          showNavbar && isMobile
            ? { height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }
            : undefined
        }
        padding="md"
      >
        <AppShell.Header style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group>
              <Anchor
                component={Link}
                to="/"
                underline="never"
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
                  size="lg"
                  aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                </ActionIcon>
              </Tooltip>

              {!loading && user && (
                <>
                  <Avatar
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? ''}
                    size="sm"
                    radius="xl"
                  />
                  <Text
                    size="sm"
                    fw={500}
                    visibleFrom="sm"
                    style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {user.displayName}
                  </Text>
                </>
              )}

              {!loading && (
                user ? (
                  <>
                    <Tooltip label="Logout">
                      <ActionIcon
                        onClick={signOut}
                        variant="subtle"
                        color="orange"
                        size="lg"
                        hiddenFrom="sm"
                        aria-label="Logout"
                      >
                        <IconLogout size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Logout">
                      <Button
                        onClick={signOut}
                        variant="subtle"
                        color="orange"
                        leftSection={<IconLogout size={16} />}
                        size="sm"
                        visibleFrom="sm"
                      >
                        Logout
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip label="Sign in with Google">
                      <ActionIcon
                        onClick={handleSignIn}
                        variant="subtle"
                        size="lg"
                        hiddenFrom="sm"
                        aria-label="Sign in with Google"
                      >
                        <IconLogin size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Sign in with Google">
                      <Button
                        onClick={handleSignIn}
                        variant="subtle"
                        leftSection={<IconLogin size={16} />}
                        size="sm"
                        visibleFrom="sm"
                      >
                        Sign in
                      </Button>
                    </Tooltip>
                  </>
                )
              )}
            </Group>
          </Group>
        </AppShell.Header>

        {showNavbar && (
          <AppShell.Navbar p="md" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <NavMenu />
          </AppShell.Navbar>
        )}

        {showNavbar && (
          <AppShell.Footer hiddenFrom="sm">
            <BottomTabBar />
          </AppShell.Footer>
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

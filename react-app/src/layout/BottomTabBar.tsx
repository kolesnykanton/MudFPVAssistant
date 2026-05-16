import { Box, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconPlaneTilt,
  IconMap,
  IconUsers,
  IconSettings,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/flights', label: 'Flights', icon: IconPlaneTilt },
  { to: '/spots', label: 'Spots', icon: IconMap },
  { to: '/community', label: 'Community', icon: IconUsers },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        height: '100%',
        width: '100%',
      }}
    >
      {tabs.map(({ to, label, icon: Icon, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname === to || location.pathname.startsWith(to + '/');

        return (
          <UnstyledButton
            key={to}
            component={Link}
            to={to}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
            }}
          >
            <Stack gap={2} align="center">
              <Icon
                size={22}
                stroke={1.5}
                color={
                  isActive
                    ? 'var(--mantine-color-blue-filled)'
                    : 'var(--mantine-color-dimmed)'
                }
              />
              <Text
                size="xs"
                style={{
                  color: isActive
                    ? 'var(--mantine-color-blue-filled)'
                    : 'var(--mantine-color-dimmed)',
                  lineHeight: 1,
                }}
              >
                {label}
              </Text>
            </Stack>
          </UnstyledButton>
        );
      })}
    </Box>
  );
}

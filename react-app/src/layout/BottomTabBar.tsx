import { Box, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconPlaneTilt,
  IconMap,
  IconTool,
  IconSettings,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/flights', label: 'Flights', icon: IconPlaneTilt },
  { to: '/spots', label: 'Flight Spots', icon: IconMap },
  { to: '/utils', label: 'Utilities', icon: IconTool },
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
        background: '#03173d',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ to, label, icon: Icon, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <UnstyledButton
            key={to}
            component={Link}
            to={to}
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
                    : 'rgba(255,255,255,0.7)'
                }
              />
              <Text
                size="xs"
                style={{
                  color: isActive
                    ? 'var(--mantine-color-blue-filled)'
                    : 'rgba(255,255,255,0.7)',
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

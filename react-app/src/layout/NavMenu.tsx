import { Box, NavLink, Stack } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconPlaneTilt,
  IconMap,
  IconUsers,
  IconTool,
  IconSettings,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const primaryLinks = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/flights', label: 'Flights', icon: IconPlaneTilt },
  { to: '/spots', label: 'Flight Spots', icon: IconMap },
  { to: '/community', label: 'Community', icon: IconUsers },
];

const secondaryLinks = [
  { to: '/utils', label: 'Utilities', icon: IconTool },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

interface NavMenuProps {
  onNavClick?: () => void;
}

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  isActive: boolean;
  onNavClick?: () => void;
}

function NavItem({ to, label, icon: Icon, isActive, onNavClick }: NavItemProps) {
  return (
    <NavLink
      component={Link}
      to={to}
      label={label}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={isActive}
      onClick={() => onNavClick?.()}
      style={{ borderRadius: 8 }}
    />
  );
}

export default function NavMenu({ onNavClick }: NavMenuProps) {
  const { pathname } = useLocation();

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack gap={4}>
        {primaryLinks.map(({ to, label, icon, end }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            isActive={end ? pathname === to : pathname.startsWith(to)}
            onNavClick={onNavClick}
          />
        ))}
      </Stack>

      <Stack gap={4} mt="auto">
        {secondaryLinks.map(({ to, label, icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            isActive={pathname.startsWith(to)}
            onNavClick={onNavClick}
          />
        ))}
      </Stack>
    </Box>
  );
}

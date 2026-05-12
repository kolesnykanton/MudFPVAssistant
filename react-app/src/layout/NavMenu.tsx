import { Box, NavLink, Stack } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconPlaneTilt,
  IconMap,
  IconTool,
  IconSettings,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const primaryLinks = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/flights', label: 'Flights', icon: IconPlaneTilt },
  { to: '/spots', label: 'Flight Spots', icon: IconMap },
];

const secondaryLinks = [
  { to: '/utils', label: 'Utilities', icon: IconTool },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

interface NavMenuProps {
  onNavClick?: () => void;
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onNavClick,
}: {
  to: string;
  label: string;
  icon: typeof IconLayoutDashboard;
  end?: boolean;
  onNavClick?: () => void;
}) {
  const location = useLocation();
  const isActive = end
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <NavLink
      component={Link}
      to={to}
      label={label}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={isActive}
      onClick={() => onNavClick?.()}
      styles={{
        root: { borderRadius: 8, color: 'white' },
        label: { color: 'white' },
      }}
    />
  );
}

export default function NavMenu({ onNavClick }: NavMenuProps) {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack gap={4}>
        {primaryLinks.map(({ to, label, icon, end }) => (
          <NavItem key={to} to={to} label={label} icon={icon} end={end} onNavClick={onNavClick} />
        ))}
      </Stack>

      <Stack gap={4} mt="auto">
        {secondaryLinks.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} onNavClick={onNavClick} />
        ))}
      </Stack>
    </Box>
  );
}

import { NavLink, Stack } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconPlaneTilt,
  IconMap,
  IconTool,
  IconSettings,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/flight-info', label: 'Flights', icon: IconPlaneTilt },
  { to: '/map-spot-save', label: 'Flight Spots', icon: IconMap },
  { to: '/utils', label: 'Utilities', icon: IconTool },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

interface NavMenuProps {
  onNavClick?: () => void;
}

export default function NavMenu({ onNavClick }: NavMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Stack gap={4}>
      {links.map(({ to, label, icon: Icon, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <NavLink
            key={to}
            label={label}
            leftSection={<Icon size={18} stroke={1.5} />}
            active={isActive}
            onClick={() => {
              navigate(to);
              onNavClick?.();
            }}
            styles={{
              root: { borderRadius: 8, color: 'white' },
              label: { color: 'white' },
            }}
          />
        );
      })}
    </Stack>
  );
}

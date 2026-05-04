import type { ReactNode } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MapIcon from '@mui/icons-material/Map';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon />, end: true },
  { label: 'Flights', to: '/flight-info', icon: <FlightTakeoffIcon /> },
  { label: 'Flight Spots', to: '/map-spot-save', icon: <MapIcon /> },
  { label: 'Utilities', to: '/utils', icon: <BuildIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
];

interface NavMenuProps {
  onClose?: () => void;
}

export default function NavMenu({ onClose }: NavMenuProps) {
  return (
    <List disablePadding>
      {navItems.map(({ label, to, icon, end }) => (
        <ListItem key={to} disablePadding>
          <ListItemButton
            component={NavLink}
            to={to}
            end={end}
            onClick={onClose}
            sx={{
              '&.active': {
                backgroundColor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

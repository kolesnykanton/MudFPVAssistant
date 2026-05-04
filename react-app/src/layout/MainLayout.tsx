import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useAuth } from '../context/AuthContext';
import NavMenu from './NavMenu';

const DRAWER_WIDTH = 220;

interface MainLayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function MainLayout({ children, darkMode, onToggleDarkMode }: MainLayoutProps) {
  const { user, loading, signIn, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const drawer = <NavMenu onClose={() => setMobileOpen(false)} />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backgroundColor: '#03173d',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            MudFPV Assistant
          </Typography>

          {!loading && user && (
            <Tooltip title={user.displayName ?? user.email ?? ''}>
              <Avatar
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? ''}
                sx={{ width: 32, height: 32, mr: 1, cursor: 'default' }}
              />
            </Tooltip>
          )}

          {!loading && (
            user ? (
              <Tooltip title="Logout">
                <IconButton color="warning" onClick={signOut}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Login with Google">
                <IconButton color="inherit" onClick={signIn}>
                  <LoginIcon />
                </IconButton>
              </Tooltip>
            )
          )}

          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color={darkMode ? 'warning' : 'default'} onClick={onToggleDarkMode}>
              {darkMode ? <WbSunnyIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        <Toolbar />
        {drawer}
      </Drawer>

      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {!loading && !user && !isMobile ? (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Please sign in to continue.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}

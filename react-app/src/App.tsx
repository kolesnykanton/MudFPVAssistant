import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import FlightInfo from './pages/FlightInfo';
import MapSpotSave from './pages/MapSpotSave';
import Utilities from './pages/Utilities';
import Settings from './pages/Settings';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#90caf9',
      },
      background: {
        default: darkMode ? '#0a1929' : '#f5f5f5',
        paper: darkMode ? '#0d2137' : '#ffffff',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <MainLayout darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/flight-info" element={<FlightInfo />} />
              <Route path="/map-spot-save" element={<MapSpotSave />} />
              <Route path="/utils" element={<Utilities />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

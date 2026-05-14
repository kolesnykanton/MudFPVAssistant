import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Loader, Center, Affix, Badge } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import PwaPrompts from './components/PwaPrompts';
import SpotlightSearch from './components/SpotlightSearch';
import { useAuth } from './context/AuthContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useOfflineSync } from './hooks/useOfflineSync';

const FlightInfo     = lazy(() => import('./pages/FlightInfo'));
const FlightLog      = lazy(() => import('./pages/FlightLog'));
const FlightStatsPage = lazy(() => import('./pages/FlightStatsPage'));
const MapSpotSave    = lazy(() => import('./pages/MapSpotSave'));
const Utilities      = lazy(() => import('./pages/Utilities'));
const Settings       = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <Center h={200}>
      <Loader />
    </Center>
  );
}

function AppServices() {
  const { uid } = useAuth();
  const { online } = useNetworkStatus();
  useOfflineSync(uid);

  return (
    <>
      {uid && <SpotlightSearch />}
      {!online && (
        <Affix position={{ bottom: 70, right: 16 }} zIndex={1500}>
          <Badge color="orange" variant="filled" size="sm">Offline</Badge>
        </Affix>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <DataProvider>
            <Notifications position="top-right" />
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/flights" element={<FlightLog />} />
                  <Route path="/flights/stats" element={<FlightStatsPage />} />
                  <Route path="/flight-info" element={<FlightInfo />} />
                  <Route path="/spots" element={<MapSpotSave />} />
                  <Route path="/map-spot-save" element={<MapSpotSave />} />
                  <Route path="/utils" element={<Utilities />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Suspense>
            </MainLayout>
            <PwaPrompts />
            <AppServices />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

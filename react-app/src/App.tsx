import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import FlightInfo from './pages/FlightInfo';
import MapSpotSave from './pages/MapSpotSave';
import Utilities from './pages/Utilities';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
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
  );
}

export default App;

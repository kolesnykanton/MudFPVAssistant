import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, sans-serif',
});

const colorSchemeManager = localStorageColorSchemeManager({ key: 'mfa-color-scheme' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
);

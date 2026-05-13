import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { theme, cssVariablesResolver } from './theme';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'mfa-color-scheme' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} colorSchemeManager={colorSchemeManager} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
);

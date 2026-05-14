import { createTheme, type CSSVariablesResolver } from '@mantine/core';

// Extend Mantine's theme.other type for full type safety on brand tokens
declare module '@mantine/core' {
  interface MantineThemeOther {
    bodyBg: string;
  }
}

/**
 * Brand theme overrides — the single canonical place for the app's look.
 *
 * Mantine handles light/dark automatically for every component.
 * Only put overrides here that differ from Mantine defaults.
 *
 * Docs: https://mantine.dev/theming/theme-object/
 */
export const theme = createTheme({
  primaryColor: 'blue',

  // Barlow: geometric, slightly condensed — aerospace/technical feel for FPV
  fontFamily: '"Barlow", system-ui, sans-serif',
  fontFamilyMonospace: '"Barlow Condensed", monospace',

  defaultRadius: 'md',

  // Brand design tokens exposed as CSS vars via cssVariablesResolver below
  other: {
    bodyBg: '#f0f2f5', // soft cool-gray canvas (light mode only)
  },

  components: {
    Paper: { defaultProps: { shadow: 'xs' } },
    Card:  { defaultProps: { shadow: 'sm' } },
  },
});

/**
 * Maps brand tokens to Mantine CSS variables, separated by color scheme.
 * Pass this to <MantineProvider cssVariablesResolver={...} />.
 *
 * Docs: https://mantine.dev/styles/css-variables/#css-variables-resolver
 */
export const cssVariablesResolver: CSSVariablesResolver = (t) => ({
  variables: {},
  light: {
    '--mantine-color-body': t.other.bodyBg,
  },
  dark: {}, // dark mode body unchanged — Mantine dark defaults are good
});

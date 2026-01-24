/**
 * Shared theme configuration for Trading Wizard.
 */

export const colors = {
  // Primary colors
  primary: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrast: '#ffffff',
  },

  // Secondary colors
  secondary: {
    main: '#64748b',
    light: '#94a3b8',
    dark: '#475569',
    contrast: '#ffffff',
  },

  // Semantic colors
  success: {
    main: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
    contrast: '#ffffff',
  },

  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrast: '#ffffff',
  },

  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrast: '#000000',
  },

  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    contrast: '#ffffff',
  },

  // Trading colors
  bullish: '#22c55e',  // Green for positive
  bearish: '#ef4444',  // Red for negative
  neutral: '#64748b',  // Gray for neutral

  // Background colors
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
    dark: '#1e293b',
  },

  // Text colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
  },

  // Border colors
  border: {
    light: '#e2e8f0',
    main: '#cbd5e1',
    dark: '#94a3b8',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
  fast: '150ms ease',
  default: '200ms ease',
  slow: '300ms ease',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;

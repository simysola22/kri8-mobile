import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-sky tokens.
export const sky: Theme = {
  name: 'sky',
  label: 'Sky',

  bg: '#061323',
  bgSurface: '#0E2239',
  bgGlass: 'rgba(125, 211, 252, 0.05)',
  bgGlassDeep: 'rgba(125, 211, 252, 0.07)',

  border: 'rgba(125, 211, 252, 0.10)',
  borderActive: 'rgba(53, 183, 243, 0.55)',

  blur: 24,

  accent: '#35B7F3',
  accentSoft: 'rgba(125, 211, 252, 0.14)',
  accentContrast: '#061323',

  text: '#F5F5F5',
  textMuted: '#8096B2',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#0A1A2E', '#061323'],
  accentGradient: ['#82D2F8', '#35B7F3'],

  tabBarBg: 'rgba(6, 19, 35, 0.92)',
  tabBarActive: '#35B7F3',
  tabBarInactive: 'rgba(128, 150, 178, 0.65)',

  statusBar: 'light-content',
};

import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-monochrome tokens.
export const monochrome: Theme = {
  name: 'monochrome',
  label: 'Monochrome',

  bg: '#0A0A0A',
  bgSurface: '#171717',
  bgGlass: 'rgba(255, 255, 255, 0.04)',
  bgGlassDeep: 'rgba(255, 255, 255, 0.06)',

  border: 'rgba(255, 255, 255, 0.10)',
  borderActive: 'rgba(255, 255, 255, 0.55)',

  blur: 24,

  accent: '#F5F5F5',
  accentSoft: 'rgba(255, 255, 255, 0.12)',
  accentContrast: '#0A0A0A',

  text: '#F5F5F5',
  textMuted: '#8C8C8C',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#121212', '#0A0A0A'],
  accentGradient: ['#FFFFFF', '#E6E6E6'],

  tabBarBg: 'rgba(10, 10, 10, 0.92)',
  tabBarActive: '#F5F5F5',
  tabBarInactive: 'rgba(140, 140, 140, 0.65)',

  statusBar: 'light-content',
};

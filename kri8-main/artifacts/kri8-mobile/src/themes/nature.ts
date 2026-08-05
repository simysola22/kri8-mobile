import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-nature tokens.
export const nature: Theme = {
  name: 'nature',
  label: 'Nature',

  bg: '#071A12',
  bgSurface: '#102D1F',
  bgGlass: 'rgba(74, 222, 128, 0.04)',
  bgGlassDeep: 'rgba(74, 222, 128, 0.07)',

  border: 'rgba(74, 222, 128, 0.10)',
  borderActive: 'rgba(65, 205, 116, 0.55)',

  blur: 24,

  accent: '#41CD74',
  accentSoft: 'rgba(74, 222, 128, 0.14)',
  accentContrast: '#071A12',

  text: '#F5F5F5',
  textMuted: '#829E8C',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#0F2A1C', '#071A12'],
  accentGradient: ['#81E5A5', '#41CD74'],

  tabBarBg: 'rgba(7, 26, 18, 0.92)',
  tabBarActive: '#41CD74',
  tabBarInactive: 'rgba(130, 158, 140, 0.65)',

  statusBar: 'light-content',
};

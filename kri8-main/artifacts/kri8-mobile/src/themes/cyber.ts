import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-cyber tokens (neon green accent).
export const cyber: Theme = {
  name: 'cyber',
  label: 'Cyber',

  bg: '#121212',
  bgSurface: '#1C1C1C',
  bgGlass: 'rgba(57, 255, 20, 0.04)',
  bgGlassDeep: 'rgba(57, 255, 20, 0.06)',

  border: 'rgba(57, 255, 20, 0.10)',
  borderActive: 'rgba(51, 255, 15, 0.55)',

  blur: 24,

  accent: '#33FF0F',
  accentSoft: 'rgba(57, 255, 20, 0.12)',
  accentContrast: '#121212',

  text: '#F5F5F5',
  textMuted: '#8C8C8C',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#171717', '#121212'],
  accentGradient: ['#79FF61', '#33FF0F'],

  tabBarBg: 'rgba(18, 18, 18, 0.92)',
  tabBarActive: '#33FF0F',
  tabBarInactive: 'rgba(140, 140, 140, 0.65)',

  statusBar: 'light-content',
};

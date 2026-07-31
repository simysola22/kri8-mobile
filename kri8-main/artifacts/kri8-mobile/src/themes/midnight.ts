import type { Theme } from './types';

export const midnight: Theme = {
  name: 'midnight',
  label: 'Midnight',

  bg: '#0D0D1A',
  bgSurface: '#13132A',
  bgGlass: 'rgba(255, 255, 255, 0.06)',
  bgGlassDeep: 'rgba(255, 255, 255, 0.10)',

  border: 'rgba(255, 255, 255, 0.10)',
  borderActive: 'rgba(124, 110, 245, 0.60)',

  blur: 24,

  accent: '#7C6EF5',
  accentSoft: 'rgba(124, 110, 245, 0.18)',
  accentContrast: '#FFFFFF',

  text: '#F0EFFF',
  textMuted: 'rgba(240, 239, 255, 0.55)',
  textFaint: 'rgba(240, 239, 255, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#1A1A3E', '#0D0D1A'],
  accentGradient: ['#9B8BFF', '#5C4FD4'],

  tabBarBg: 'rgba(13, 13, 26, 0.92)',
  tabBarActive: '#7C6EF5',
  tabBarInactive: 'rgba(240, 239, 255, 0.35)',

  statusBar: 'light-content',
};

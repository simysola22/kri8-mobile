import type { Theme } from './types';

export const sky: Theme = {
  name: 'sky',
  label: 'Sky',

  bg: '#F0F8FF',
  bgSurface: '#E4F3FF',
  bgGlass: 'rgba(255, 255, 255, 0.55)',
  bgGlassDeep: 'rgba(255, 255, 255, 0.75)',

  border: 'rgba(0, 153, 230, 0.16)',
  borderActive: 'rgba(0, 153, 230, 0.55)',

  blur: 18,

  accent: '#0099E6',
  accentSoft: 'rgba(0, 153, 230, 0.12)',
  accentContrast: '#FFFFFF',

  text: '#0D2340',
  textMuted: 'rgba(13, 35, 64, 0.54)',
  textFaint: 'rgba(13, 35, 64, 0.30)',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  gradient: ['#DCEEFF', '#F0F8FF'],
  accentGradient: ['#38B6FF', '#0076C0'],

  tabBarBg: 'rgba(240, 248, 255, 0.94)',
  tabBarActive: '#0099E6',
  tabBarInactive: 'rgba(13, 35, 64, 0.35)',

  statusBar: 'dark-content',
};

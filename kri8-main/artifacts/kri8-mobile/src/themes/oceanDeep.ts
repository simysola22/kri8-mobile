import type { Theme } from './types';

export const oceanDeep: Theme = {
  name: 'ocean-deep',
  label: 'Ocean Deep',

  bg: '#071828',
  bgSurface: '#0A2035',
  bgGlass: 'rgba(0, 196, 255, 0.06)',
  bgGlassDeep: 'rgba(0, 196, 255, 0.11)',

  border: 'rgba(0, 196, 255, 0.14)',
  borderActive: 'rgba(0, 196, 255, 0.55)',

  blur: 22,

  accent: '#00C4FF',
  accentSoft: 'rgba(0, 196, 255, 0.16)',
  accentContrast: '#071828',

  text: '#E8F8FF',
  textMuted: 'rgba(232, 248, 255, 0.55)',
  textFaint: 'rgba(232, 248, 255, 0.28)',

  success: '#34D399',
  warning: '#FCD34D',
  error: '#FB7185',

  gradient: ['#0A2A45', '#071828'],
  accentGradient: ['#38DEFF', '#0099CC'],

  tabBarBg: 'rgba(7, 24, 40, 0.93)',
  tabBarActive: '#00C4FF',
  tabBarInactive: 'rgba(232, 248, 255, 0.35)',

  statusBar: 'light-content',
};

import type { Theme } from './types';

export const crimson: Theme = {
  name: 'crimson',
  label: 'Crimson',

  bg: '#0F0507',
  bgSurface: '#1A080C',
  bgGlass: 'rgba(255, 51, 102, 0.06)',
  bgGlassDeep: 'rgba(255, 51, 102, 0.11)',

  border: 'rgba(255, 51, 102, 0.16)',
  borderActive: 'rgba(255, 51, 102, 0.65)',

  blur: 22,

  accent: '#FF3366',
  accentSoft: 'rgba(255, 51, 102, 0.15)',
  accentContrast: '#FFFFFF',

  text: '#FFE8EC',
  textMuted: 'rgba(255, 232, 236, 0.54)',
  textFaint: 'rgba(255, 232, 236, 0.26)',

  success: '#4ADE80',
  warning: '#FCD34D',
  error: '#FF3366',

  gradient: ['#2A050D', '#0F0507'],
  accentGradient: ['#FF6B8E', '#CC1A44'],

  tabBarBg: 'rgba(15, 5, 7, 0.94)',
  tabBarActive: '#FF3366',
  tabBarInactive: 'rgba(255, 232, 236, 0.34)',

  statusBar: 'light-content',
};

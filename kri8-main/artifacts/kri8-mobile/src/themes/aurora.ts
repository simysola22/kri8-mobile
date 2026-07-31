import type { Theme } from './types';

export const aurora: Theme = {
  name: 'aurora',
  label: 'Aurora',

  bg: '#07091F',
  bgSurface: '#0E1035',
  bgGlass: 'rgba(100, 237, 207, 0.07)',
  bgGlassDeep: 'rgba(100, 237, 207, 0.12)',

  border: 'rgba(100, 237, 207, 0.16)',
  borderActive: 'rgba(100, 237, 207, 0.65)',

  blur: 28,

  accent: '#64EDCF',
  accentSoft: 'rgba(100, 237, 207, 0.15)',
  accentContrast: '#07091F',

  text: '#E8FFFB',
  textMuted: 'rgba(232, 255, 251, 0.54)',
  textFaint: 'rgba(232, 255, 251, 0.26)',

  success: '#64EDCF',
  warning: '#FFD166',
  error: '#FF6B9D',

  gradient: ['#1A0A3E', '#07091F'],
  accentGradient: ['#96F7E0', '#36C9AA'],

  tabBarBg: 'rgba(7, 9, 31, 0.93)',
  tabBarActive: '#64EDCF',
  tabBarInactive: 'rgba(232, 255, 251, 0.32)',

  statusBar: 'light-content',
};

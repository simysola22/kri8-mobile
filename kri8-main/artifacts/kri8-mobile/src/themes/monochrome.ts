import type { Theme } from './types';

export const monochrome: Theme = {
  name: 'monochrome',
  label: 'Monochrome',

  bg: '#0A0A0A',
  bgSurface: '#141414',
  bgGlass: 'rgba(255, 255, 255, 0.07)',
  bgGlassDeep: 'rgba(255, 255, 255, 0.12)',

  border: 'rgba(255, 255, 255, 0.11)',
  borderActive: 'rgba(255, 255, 255, 0.70)',

  blur: 20,

  accent: '#FFFFFF',
  accentSoft: 'rgba(255, 255, 255, 0.12)',
  accentContrast: '#0A0A0A',

  text: '#F5F5F5',
  textMuted: 'rgba(245, 245, 245, 0.52)',
  textFaint: 'rgba(245, 245, 245, 0.24)',

  success: '#86EFAC',
  warning: '#FDE68A',
  error: '#FCA5A5',

  gradient: ['#1C1C1C', '#0A0A0A'],
  accentGradient: ['#FFFFFF', '#888888'],

  tabBarBg: 'rgba(10, 10, 10, 0.95)',
  tabBarActive: '#FFFFFF',
  tabBarInactive: 'rgba(245, 245, 245, 0.32)',

  statusBar: 'light-content',
};

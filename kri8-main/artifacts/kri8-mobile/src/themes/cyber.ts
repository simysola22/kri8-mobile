import type { Theme } from './types';

export const cyber: Theme = {
  name: 'cyber',
  label: 'Cyber',

  bg: '#030811',
  bgSurface: '#070F1C',
  bgGlass: 'rgba(0, 255, 100, 0.05)',
  bgGlassDeep: 'rgba(0, 255, 100, 0.09)',

  border: 'rgba(0, 255, 100, 0.14)',
  borderActive: 'rgba(0, 255, 100, 0.60)',

  blur: 20,

  accent: '#00FF64',
  accentSoft: 'rgba(0, 255, 100, 0.14)',
  accentContrast: '#030811',

  text: '#E0FFE8',
  textMuted: 'rgba(224, 255, 232, 0.52)',
  textFaint: 'rgba(224, 255, 232, 0.25)',

  success: '#00FF64',
  warning: '#FFD700',
  error: '#FF4560',

  gradient: ['#061a10', '#030811'],
  accentGradient: ['#39FF8F', '#00CC50'],

  tabBarBg: 'rgba(3, 8, 17, 0.95)',
  tabBarActive: '#00FF64',
  tabBarInactive: 'rgba(224, 255, 232, 0.32)',

  statusBar: 'light-content',
};

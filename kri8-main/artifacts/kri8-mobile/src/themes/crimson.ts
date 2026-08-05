import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-crimson tokens.
export const crimson: Theme = {
  name: 'crimson',
  label: 'Crimson',

  bg: '#0F0F0F',
  bgSurface: '#1C1717',
  bgGlass: 'rgba(220, 38, 38, 0.06)',
  bgGlassDeep: 'rgba(220, 38, 38, 0.08)',

  border: 'rgba(220, 38, 38, 0.12)',
  borderActive: 'rgba(220, 40, 40, 0.55)',

  blur: 24,

  accent: '#DC2828',
  accentSoft: 'rgba(220, 38, 38, 0.16)',
  accentContrast: '#FFFFFF',

  text: '#F7F7F7',
  textMuted: '#9C8B8B',
  textFaint: 'rgba(247, 247, 247, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#161313', '#0F0F0F'],
  accentGradient: ['#E76E6E', '#DC2828'],

  tabBarBg: 'rgba(15, 15, 15, 0.92)',
  tabBarActive: '#DC2828',
  tabBarInactive: 'rgba(156, 139, 139, 0.65)',

  statusBar: 'light-content',
};

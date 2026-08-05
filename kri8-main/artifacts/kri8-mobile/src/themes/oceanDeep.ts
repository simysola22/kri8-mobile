import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-ocean tokens.
export const oceanDeep: Theme = {
  name: 'ocean-deep',
  label: 'Ocean Deep',

  bg: '#00172E',
  bgSurface: '#0F263D',
  bgGlass: 'rgba(56, 189, 248, 0.05)',
  bgGlassDeep: 'rgba(56, 189, 248, 0.07)',

  border: 'rgba(56, 189, 248, 0.10)',
  borderActive: 'rgba(38, 178, 242, 0.55)',

  blur: 24,

  accent: '#26B2F2',
  accentSoft: 'rgba(56, 189, 248, 0.14)',
  accentContrast: '#00172E',

  text: '#F5F5F5',
  textMuted: '#8099B2',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#091F34', '#00172E'],
  accentGradient: ['#73CDF7', '#26B2F2'],

  tabBarBg: 'rgba(0, 23, 46, 0.92)',
  tabBarActive: '#26B2F2',
  tabBarInactive: 'rgba(128, 153, 178, 0.65)',

  statusBar: 'light-content',
};

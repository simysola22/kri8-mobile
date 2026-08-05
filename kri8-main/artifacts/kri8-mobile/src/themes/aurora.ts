import type { Theme } from './types';

// Ported 1:1 from the web app's .theme-aurora tokens (violet accent).
export const aurora: Theme = {
  name: 'aurora',
  label: 'Aurora',

  bg: '#0C1322',
  bgSurface: '#131D34',
  bgGlass: 'rgba(139, 92, 246, 0.06)',
  bgGlassDeep: 'rgba(139, 92, 246, 0.08)',

  border: 'rgba(139, 92, 246, 0.12)',
  borderActive: 'rgba(137, 81, 236, 0.55)',

  blur: 24,

  accent: '#8951EC',
  accentSoft: 'rgba(139, 92, 246, 0.16)',
  accentContrast: '#FFFFFF',

  text: '#F5F5F5',
  textMuted: '#8591AD',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#10192D', '#0C1322'],
  accentGradient: ['#BB9AF4', '#8951EC'],

  tabBarBg: 'rgba(12, 19, 34, 0.92)',
  tabBarActive: '#8951EC',
  tabBarInactive: 'rgba(133, 145, 173, 0.65)',

  statusBar: 'light-content',
};

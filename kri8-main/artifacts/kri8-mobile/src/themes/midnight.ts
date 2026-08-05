import type { Theme } from './types';

// Ported 1:1 from the web app's index.css (:root / .theme-midnight tokens):
// --background: 228 34% 11%, --primary: 43 74% 52% (gold), etc.
export const midnight: Theme = {
  name: 'midnight',
  label: 'Midnight',

  bg: '#131626',
  bgSurface: '#1B2037',
  bgGlass: 'rgba(255, 255, 255, 0.04)',
  bgGlassDeep: 'rgba(255, 255, 255, 0.07)',

  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(223, 172, 42, 0.55)',

  blur: 24,

  accent: '#DFAC2A',
  accentSoft: 'rgba(212, 175, 55, 0.12)',
  accentContrast: '#131626',

  text: '#F5F5F5',
  textMuted: '#8A90A8',
  textFaint: 'rgba(245, 245, 245, 0.28)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  gradient: ['#181C30', '#131626'],
  accentGradient: ['#EAC871', '#DFAC2A'],

  tabBarBg: 'rgba(19, 22, 38, 0.92)',
  tabBarActive: '#DFAC2A',
  tabBarInactive: 'rgba(138, 144, 168, 0.65)',

  statusBar: 'light-content',
};

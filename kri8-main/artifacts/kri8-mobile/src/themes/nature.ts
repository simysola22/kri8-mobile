import type { Theme } from './types';

export const nature: Theme = {
  name: 'nature',
  label: 'Nature',

  bg: '#0A1409',
  bgSurface: '#111E10',
  bgGlass: 'rgba(93, 184, 92, 0.07)',
  bgGlassDeep: 'rgba(93, 184, 92, 0.12)',

  border: 'rgba(93, 184, 92, 0.18)',
  borderActive: 'rgba(93, 184, 92, 0.65)',

  blur: 22,

  accent: '#5DB85C',
  accentSoft: 'rgba(93, 184, 92, 0.16)',
  accentContrast: '#FFFFFF',

  text: '#E8F5E8',
  textMuted: 'rgba(232, 245, 232, 0.54)',
  textFaint: 'rgba(232, 245, 232, 0.26)',

  success: '#5DB85C',
  warning: '#D4A017',
  error: '#E85656',

  gradient: ['#182A12', '#0A1409'],
  accentGradient: ['#7ED87D', '#3D8F3C'],

  tabBarBg: 'rgba(10, 20, 9, 0.93)',
  tabBarActive: '#5DB85C',
  tabBarInactive: 'rgba(232, 245, 232, 0.34)',

  statusBar: 'light-content',
};

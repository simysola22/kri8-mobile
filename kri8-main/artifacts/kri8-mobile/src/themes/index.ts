export type { Theme } from './types';
export { midnight } from './midnight';
export { oceanDeep } from './oceanDeep';
export { monochrome } from './monochrome';
export { cyber } from './cyber';
export { aurora } from './aurora';
export { nature } from './nature';
export { sky } from './sky';
export { crimson } from './crimson';

import type { Theme } from './types';
import type { ThemeName } from '@/types';
import { midnight } from './midnight';
import { oceanDeep } from './oceanDeep';
import { monochrome } from './monochrome';
import { cyber } from './cyber';
import { aurora } from './aurora';
import { nature } from './nature';
import { sky } from './sky';
import { crimson } from './crimson';

export const THEMES: Record<ThemeName, Theme> = {
  midnight,
  'ocean-deep': oceanDeep,
  monochrome,
  cyber,
  aurora,
  nature,
  sky,
  crimson,
};

export const THEME_LIST: Theme[] = Object.values(THEMES);

export function getTheme(name: ThemeName | null | undefined): Theme {
  return THEMES[name ?? 'midnight'] ?? midnight;
}

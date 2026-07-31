import type { ThemeName } from '@/types';

export interface Theme {
  name: ThemeName;
  label: string;

  // ── Backgrounds ──────────────────────────────────────────────
  /** Primary screen background */
  bg: string;
  /** Secondary background for cards/surfaces without glass */
  bgSurface: string;
  /** Glassmorphism surface — rgba with low opacity */
  bgGlass: string;
  /** Glass surface with slightly more opacity (for nested cards) */
  bgGlassDeep: string;

  // ── Borders ──────────────────────────────────────────────────
  /** Glass border — rgba white/color at low opacity */
  border: string;
  /** Stronger border for focused/active states */
  borderActive: string;

  // ── Blur ─────────────────────────────────────────────────────
  /** BlurView intensity (expo-blur) */
  blur: number;

  // ── Accent colors ────────────────────────────────────────────
  accent: string;
  accentSoft: string;
  accentContrast: string; // text color on accent background

  // ── Text ─────────────────────────────────────────────────────
  text: string;
  textMuted: string;
  textFaint: string;

  // ── Semantic colors ──────────────────────────────────────────
  success: string;
  warning: string;
  error: string;

  // ── Gradients ────────────────────────────────────────────────
  /** Hero / screen gradient [top, bottom] */
  gradient: [string, string];
  /** Accent gradient for buttons / highlights */
  accentGradient: [string, string];

  // ── Tab bar ──────────────────────────────────────────────────
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;

  // ── Status bar ───────────────────────────────────────────────
  statusBar: 'light-content' | 'dark-content';
}

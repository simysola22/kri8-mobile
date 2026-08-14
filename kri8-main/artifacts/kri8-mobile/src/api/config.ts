/**
 * Single source of truth for the backend API location.
 *
 * Every network call in the app derives its URL from here. Do NOT re-inline
 * `process.env.EXPO_PUBLIC_API_BASE_URL` or the production fallback anywhere
 * else — import from this module instead so the base URL is defined in one
 * place.
 */

const FALLBACK_API_BASE_URL = 'https://kri8-obvh.onrender.com';

/** Backend origin, e.g. `https://api.kri8.space` (no trailing slash, no `/api`). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? FALLBACK_API_BASE_URL;

/** Backend REST root, i.e. `${API_BASE_URL}/api`. Use for `${API_URL}${path}`. */
export const API_URL = `${API_BASE_URL}/api`;

// Surface a missing env var loudly in development. Without this, a build that
// forgot to set EXPO_PUBLIC_API_BASE_URL would silently ship pointing at the
// hardcoded production fallback instead of failing visibly.
if (__DEV__ && !process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.warn(
    '[api/config] EXPO_PUBLIC_API_BASE_URL is not set — falling back to ' +
      `${FALLBACK_API_BASE_URL}. Set it in your environment to target a ` +
      'different backend.',
  );
}

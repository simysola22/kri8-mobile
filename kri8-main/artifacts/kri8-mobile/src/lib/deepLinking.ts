/**
 * Deep linking utilities.
 *
 * Supported URL schemes:
 *   kri8://idea/{id}
 *   kri8://profile/{username}
 *   kri8://community
 *   kri8://calendar
 *   kri8://capture
 *
 * Universal links (https://kri8.space/...):
 *   https://kri8.space/idea/{id}
 *   https://kri8.space/profile/{username}
 *   https://kri8.space/community
 *   https://kri8.space/calendar
 *   https://kri8.space/capture
 *
 * Expo Router handles deep links automatically via the `scheme` in app.json.
 * This module provides helpers for building and parsing deep-link URLs,
 * and for programmatic navigation from notification payloads.
 */
import * as Linking from 'expo-linking';

// ── Route mapping ─────────────────────────────────────────────

export type DeepLinkRoute =
  | { screen: 'idea'; id: number }
  | { screen: 'profile'; username: string }
  | { screen: 'community' }
  | { screen: 'calendar' }
  | { screen: 'capture' };

const APP_SCHEME = 'kri8';
const UNIVERSAL_DOMAIN = 'kri8.space';

// ── Build URLs ────────────────────────────────────────────────

/** Build a kri8:// deep link URL. */
export function buildDeepLink(route: DeepLinkRoute): string {
  switch (route.screen) {
    case 'idea':
      return `${APP_SCHEME}://idea/${route.id}`;
    case 'profile':
      return `${APP_SCHEME}://profile/${route.username}`;
    case 'community':
      return `${APP_SCHEME}://community`;
    case 'calendar':
      return `${APP_SCHEME}://calendar`;
    case 'capture':
      return `${APP_SCHEME}://capture`;
  }
}

/** Build a universal link (https://kri8.space/...). */
export function buildUniversalLink(route: DeepLinkRoute): string {
  switch (route.screen) {
    case 'idea':
      return `https://${UNIVERSAL_DOMAIN}/idea/${route.id}`;
    case 'profile':
      return `https://${UNIVERSAL_DOMAIN}/profile/${route.username}`;
    case 'community':
      return `https://${UNIVERSAL_DOMAIN}/community`;
    case 'calendar':
      return `https://${UNIVERSAL_DOMAIN}/calendar`;
    case 'capture':
      return `https://${UNIVERSAL_DOMAIN}/capture`;
  }
}

// ── Parse URLs ────────────────────────────────────────────────

/**
 * Parse a kri8:// or https://kri8.space URL into a typed route.
 * Returns null for unrecognised URLs.
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? '';

    // kri8://idea/123
    const ideaMatch = path.match(/^idea\/(\d+)$/);
    if (ideaMatch) return { screen: 'idea', id: Number(ideaMatch[1]) };

    // kri8://profile/username
    const profileMatch = path.match(/^profile\/(.+)$/);
    if (profileMatch) return { screen: 'profile', username: profileMatch[1] };

    if (path === 'community') return { screen: 'community' };
    if (path === 'calendar') return { screen: 'calendar' };
    if (path === 'capture') return { screen: 'capture' };

    return null;
  } catch {
    return null;
  }
}

/**
 * Map a parsed deep-link route to an Expo Router path.
 * Use with `router.push()` or `router.replace()`.
 */
export function routeToExpoPath(route: DeepLinkRoute): string {
  switch (route.screen) {
    case 'idea':
      return `/(tabs)/ideas/${route.id}`;
    case 'profile':
      return `/(tabs)/community/profile/${route.username}`;
    case 'community':
      return '/(tabs)/community';
    case 'calendar':
      return '/(tabs)/ideas'; // calendar view within ideas tab
    case 'capture':
      return '/(tabs)/capture';
  }
}

// ── Open external ─────────────────────────────────────────────

/** Open a URL in the system browser. */
export async function openExternalUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

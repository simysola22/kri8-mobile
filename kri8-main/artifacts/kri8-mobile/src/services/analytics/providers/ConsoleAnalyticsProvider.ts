/**
 * ConsoleAnalyticsProvider
 *
 * Development-only analytics provider that logs events to the console.
 * Swap for Firebase Analytics, Mixpanel, Amplitude, etc. without
 * touching any call sites.
 */
import type { AnalyticsProvider, AnalyticsEvent } from '../types';

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'console';

  identify(userId: string, traits?: Record<string, string | number | boolean>): void {
    console.log('[Analytics] identify', { userId, traits });
  }

  track(event: AnalyticsEvent): void {
    console.log('[Analytics] track', event.name, event.properties ?? {});
  }

  reset(): void {
    console.log('[Analytics] reset');
  }
}

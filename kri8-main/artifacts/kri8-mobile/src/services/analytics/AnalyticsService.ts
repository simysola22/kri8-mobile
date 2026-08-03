/**
 * AnalyticsService
 *
 * Provider-independent analytics layer. Call `analytics.track(...)` anywhere
 * in the app. Swap or add providers via `addProvider()` without changing call sites.
 *
 * Usage:
 *   analytics.track({ name: 'idea_created', properties: { origin: 'voice' } });
 */
import type { AnalyticsProvider, AnalyticsEvent, AnalyticsEventName } from './types';
import { ConsoleAnalyticsProvider } from './providers/ConsoleAnalyticsProvider';

class AnalyticsService {
  private providers: AnalyticsProvider[] = [];
  private currentUserId: string | null = null;

  constructor() {
    // Default: console provider (dev-only). Replace in production.
    if (__DEV__) {
      this.providers.push(new ConsoleAnalyticsProvider());
    }
  }

  // ── Provider management ───────────────────────────────────

  /** Register an analytics provider. Call before `identify`. */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  /** Remove a provider by name. */
  removeProvider(name: string): void {
    this.providers = this.providers.filter((p) => p.name !== name);
  }

  // ── Identity ──────────────────────────────────────────────

  /** Call once when the user signs in. */
  identify(userId: string, traits?: Record<string, string | number | boolean>): void {
    this.currentUserId = userId;
    for (const provider of this.providers) {
      try {
        provider.identify(userId, traits);
      } catch (err) {
        console.warn(`[AnalyticsService] identify failed for ${provider.name}:`, err);
      }
    }
  }

  /** Call on sign-out. */
  reset(): void {
    this.currentUserId = null;
    for (const provider of this.providers) {
      try {
        provider.reset();
      } catch (err) {
        console.warn(`[AnalyticsService] reset failed for ${provider.name}:`, err);
      }
    }
  }

  // ── Tracking ──────────────────────────────────────────────

  /** Track a named event with optional properties. */
  track(
    nameOrEvent: AnalyticsEventName | AnalyticsEvent,
    properties?: Record<string, string | number | boolean | null>,
  ): void {
    const event: AnalyticsEvent =
      typeof nameOrEvent === 'string'
        ? { name: nameOrEvent, properties, timestamp: Date.now() }
        : { timestamp: Date.now(), ...nameOrEvent };

    for (const provider of this.providers) {
      try {
        provider.track(event);
      } catch (err) {
        console.warn(`[AnalyticsService] track failed for ${provider.name}:`, err);
      }
    }
  }
}

/** Singleton analytics instance — import and use anywhere. */
export const analytics = new AnalyticsService();

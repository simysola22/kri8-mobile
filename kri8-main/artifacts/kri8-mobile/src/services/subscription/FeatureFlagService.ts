/**
 * FeatureFlagService
 *
 * Controls which features are enabled for a user.
 * All flags default to ON during launch (Kri8 is free).
 * Remote overrides can be fetched from the API later.
 */
import { createStorage } from '@/lib/kv';

const storage = createStorage('kri8-feature-flags');
const FLAGS_KEY = 'flags';

// ── Types ─────────────────────────────────────────────────────

export type FeatureFlag =
  | 'universal_search'
  | 'ai_assistant'
  | 'voice_capture'
  | 'camera_capture'
  | 'creator_score'
  | 'collaboration'
  | 'media_uploads'
  | 'advanced_analytics'
  | 'custom_themes'
  | 'export';

type FlagMap = Partial<Record<FeatureFlag, boolean>>;

// Default — everything enabled at launch
const DEFAULTS: Record<FeatureFlag, boolean> = {
  universal_search: true,
  ai_assistant: true,
  voice_capture: true,
  camera_capture: true,
  creator_score: true,
  collaboration: true,
  media_uploads: true,
  advanced_analytics: true,
  custom_themes: true,
  export: true,
};

// ── Service ───────────────────────────────────────────────────

class FeatureFlagService {
  private flags: FlagMap = {};
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    const raw = storage.getString(FLAGS_KEY);
    if (raw) {
      try {
        this.flags = JSON.parse(raw) as FlagMap;
      } catch {
        this.flags = {};
      }
    }
    this.loaded = true;
  }

  /** Returns true if the feature is enabled. Defaults to true if not configured. */
  isEnabled(flag: FeatureFlag): boolean {
    this.load();
    const override = this.flags[flag];
    if (override !== undefined) return override;
    return DEFAULTS[flag] ?? true;
  }

  /**
   * Fetch remote flag overrides from the API and persist them.
   * Currently a no-op — wire to your remote config service.
   */
  async fetchRemoteFlags(_userId: string): Promise<void> {
    // TODO: Fetch from remote config or API /features endpoint.
    // On success: call this.applyFlags(remoteFlags)
  }

  /** Apply a full flag map and persist it. */
  applyFlags(flags: FlagMap): void {
    this.flags = { ...this.flags, ...flags };
    storage.set(FLAGS_KEY, JSON.stringify(this.flags));
  }

  reset(): void {
    this.flags = {};
    this.loaded = false;
    storage.delete(FLAGS_KEY);
  }
}

export const featureFlags = new FeatureFlagService();

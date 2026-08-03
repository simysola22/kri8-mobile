/**
 * EntitlementService
 *
 * Determines what a user is entitled to based on their subscription tier
 * and feature flags. All entitlements are unlocked at launch.
 *
 * Usage:
 *   if (entitlements.canUse('unlimited_ideas')) { ... }
 */
import { subscriptionService } from './SubscriptionService';
import { featureFlags } from './FeatureFlagService';
import type { SubscriptionTier } from './SubscriptionService';
import type { FeatureFlag } from './FeatureFlagService';

// ── Types ─────────────────────────────────────────────────────

export type Entitlement =
  | 'unlimited_ideas'
  | 'ai_assistant'
  | 'voice_capture'
  | 'camera_capture'
  | 'media_uploads'
  | 'export'
  | 'collaboration'
  | 'advanced_analytics'
  | 'custom_themes'
  | 'creator_score'
  | 'priority_support';

type EntitlementMap = Partial<Record<Entitlement, SubscriptionTier[]>>;

/**
 * Which tiers grant which entitlements.
 * During launch: all tiers (including 'free') get everything.
 */
const TIER_GATES: EntitlementMap = {
  unlimited_ideas: ['free', 'creator', 'pro'],
  ai_assistant: ['free', 'creator', 'pro'],
  voice_capture: ['free', 'creator', 'pro'],
  camera_capture: ['free', 'creator', 'pro'],
  media_uploads: ['free', 'creator', 'pro'],
  export: ['free', 'creator', 'pro'],
  collaboration: ['free', 'creator', 'pro'],
  advanced_analytics: ['free', 'creator', 'pro'],
  custom_themes: ['free', 'creator', 'pro'],
  creator_score: ['free', 'creator', 'pro'],
  priority_support: ['creator', 'pro'],
};

// Map entitlements to the feature flag that also guards them
const ENTITLEMENT_TO_FLAG: Partial<Record<Entitlement, FeatureFlag>> = {
  ai_assistant: 'ai_assistant',
  voice_capture: 'voice_capture',
  camera_capture: 'camera_capture',
  media_uploads: 'media_uploads',
  export: 'export',
  collaboration: 'collaboration',
  advanced_analytics: 'advanced_analytics',
  custom_themes: 'custom_themes',
  creator_score: 'creator_score',
};

// ── Service ───────────────────────────────────────────────────

class EntitlementService {
  /**
   * Returns true if the current user is entitled to the given capability.
   * Checks both subscription tier and feature flags.
   */
  canUse(entitlement: Entitlement): boolean {
    const status = subscriptionService.getStatus();
    const allowedTiers = TIER_GATES[entitlement] ?? ['free', 'creator', 'pro'];
    const tierOk = allowedTiers.includes(status.tier);

    const flag = ENTITLEMENT_TO_FLAG[entitlement];
    const flagOk = flag ? featureFlags.isEnabled(flag) : true;

    return tierOk && flagOk;
  }

  /** Returns the minimum tier required for an entitlement. */
  minimumTierFor(entitlement: Entitlement): SubscriptionTier {
    const tiers = TIER_GATES[entitlement] ?? ['free'];
    if (tiers.includes('free')) return 'free';
    if (tiers.includes('creator')) return 'creator';
    return 'pro';
  }
}

export const entitlements = new EntitlementService();

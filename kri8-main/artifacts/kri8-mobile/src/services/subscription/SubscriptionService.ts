/**
 * SubscriptionService
 *
 * Architecture placeholder for future monetization.
 * Kri8 is free at launch — no restrictions are enabled yet.
 *
 * When ready to monetize, implement `fetchSubscriptionStatus` to call
 * RevenueCat, Stripe, or another billing provider. The rest of the
 * app (FeatureFlagService, EntitlementService, PremiumGate) will
 * pick up the real status automatically.
 */
import { createStorage } from '@/lib/kv';

const storage = createStorage('kri8-subscription');
const STATUS_KEY = 'subscription_status';

// ── Types ─────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'creator' | 'pro';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: number; // Unix ms
  provider?: string;
  productId?: string;
}

const FREE_STATUS: SubscriptionStatus = {
  tier: 'free',
  isActive: true,
};

// ── Service ───────────────────────────────────────────────────

class SubscriptionService {
  private cachedStatus: SubscriptionStatus | null = null;

  /** Return the current subscription status. */
  getStatus(): SubscriptionStatus {
    if (this.cachedStatus) return this.cachedStatus;
    const raw = storage.getString(STATUS_KEY);
    if (raw) {
      try {
        this.cachedStatus = JSON.parse(raw) as SubscriptionStatus;
        return this.cachedStatus;
      } catch {
        // fall through
      }
    }
    return FREE_STATUS;
  }

  /**
   * Fetch and cache the subscription status from the billing provider.
   * Currently returns FREE — wire this to RevenueCat/Stripe when ready.
   */
  async fetchSubscriptionStatus(_userId: string): Promise<SubscriptionStatus> {
    // TODO: Replace with real billing provider call.
    const status = FREE_STATUS;
    this.cachedStatus = status;
    storage.set(STATUS_KEY, JSON.stringify(status));
    return status;
  }

  /** Called on sign-out. */
  reset(): void {
    this.cachedStatus = null;
    storage.delete(STATUS_KEY);
  }
}

export const subscriptionService = new SubscriptionService();

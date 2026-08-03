/**
 * Analytics types — provider-independent.
 *
 * All analytics events flow through AnalyticsService which dispatches
 * to one or more pluggable providers. No vendor SDK is imported here.
 */

// ── Event catalog ─────────────────────────────────────────────

export type AnalyticsEventName =
  | 'idea_created'
  | 'idea_edited'
  | 'idea_deleted'
  | 'idea_marked_used'
  | 'idea_branched'
  | 'voice_capture_started'
  | 'voice_capture_completed'
  | 'camera_capture_started'
  | 'camera_capture_completed'
  | 'search_performed'
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'message_sent'
  | 'trend_viewed'
  | 'trend_analyzed'
  | 'ai_inspiration_requested'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_dismissed'
  | 'export_performed'
  | 'theme_changed'
  | 'offline_sync_completed'
  | 'offline_sync_failed'
  | 'notification_received'
  | 'notification_opened'
  | 'biometric_enabled'
  | 'biometric_disabled'
  | 'biometric_auth_success'
  | 'biometric_auth_failed'
  | 'deep_link_opened'
  | 'draft_recovered'
  | 'capture_content_detected'
  | 'creator_score_viewed';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
}

// ── Provider interface ────────────────────────────────────────

/**
 * Implement this interface to add a new analytics provider.
 * Swap providers without touching call sites.
 */
export interface AnalyticsProvider {
  readonly name: string;
  /** Called once on app start with a stable user identifier. */
  identify(userId: string, traits?: Record<string, string | number | boolean>): void;
  /** Track a discrete event. */
  track(event: AnalyticsEvent): void;
  /** Called on sign-out to clear the current user identity. */
  reset(): void;
}

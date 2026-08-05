/**
 * CreatorScoreService
 *
 * Creator reputation architecture. The score is NOT exposed publicly yet.
 * Only the mobile architecture is built here; the backend model is prepared
 * to receive the signals when the feature is activated.
 *
 * Score signals (to be weighted server-side):
 *  - Ideas created
 *  - Consistency (streak)
 *  - Community engagement (messages, friend interactions)
 *  - Helpful feedback
 *  - Trend accuracy
 *  - Collaboration
 *
 * ⚠️ NOT YET WIRED UP: nothing in app/ currently calls this service.
 * ⚠️ BACKEND MISSING: GET /api/users/{id}/creator-score does not exist on
 * the real Express API yet (verified against lib/api-spec/openapi.yaml).
 * fetchCreatorScore() will 404 until that route is built.
 */
import { createStorage } from '@/lib/kv';

const storage = createStorage('kri8-creator-score');
const SCORE_KEY = 'score';
const SIGNALS_KEY = 'signals';

// ── Types ─────────────────────────────────────────────────────

export interface CreatorScore {
  /** Composite score 0-1000. Null until calculated server-side. */
  score: number | null;
  /** Score breakdown by category. */
  breakdown: ScoreBreakdown;
  /** When the score was last calculated (Unix ms). */
  calculatedAt: number | null;
}

export interface ScoreBreakdown {
  consistency: number;
  engagement: number;
  trendAccuracy: number;
  collaboration: number;
  ideaVolume: number;
}

export interface CreatorSignal {
  type:
    | 'idea_created'
    | 'idea_used'
    | 'streak_day'
    | 'friend_interaction'
    | 'trend_hit'
    | 'collaboration';
  value?: number;
  timestamp: number;
}

// ── Local signal buffer ───────────────────────────────────────

/**
 * Buffer a creator signal locally.
 * Signals are flushed to the API when online (via offline queue or direct call).
 */
export function bufferSignal(signal: Omit<CreatorSignal, 'timestamp'>): void {
  const signals = getBufferedSignals();
  signals.push({ ...signal, timestamp: Date.now() });
  // Keep last 500 signals to avoid unbounded growth
  const trimmed = signals.slice(-500);
  storage.set(SIGNALS_KEY, JSON.stringify(trimmed));
}

/** Return all locally buffered signals. */
export function getBufferedSignals(): CreatorSignal[] {
  const raw = storage.getString(SIGNALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CreatorSignal[];
  } catch {
    return [];
  }
}

/** Clear buffered signals after a successful flush. */
export function clearBufferedSignals(): void {
  storage.delete(SIGNALS_KEY);
}

// ── Cached score ──────────────────────────────────────────────

/** Return the last cached creator score (or null if never fetched). */
export function getCachedScore(): CreatorScore | null {
  const raw = storage.getString(SCORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreatorScore;
  } catch {
    return null;
  }
}

/** Cache a creator score returned by the API. */
export function cacheScore(score: CreatorScore): void {
  storage.set(SCORE_KEY, JSON.stringify(score));
}

/** Fetch the creator score from the API. */
export async function fetchCreatorScore(
  token: string,
  userId: number,
): Promise<CreatorScore | null> {
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';
  try {
    const res = await fetch(`${API_BASE}/api/users/${userId}/creator-score`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getCachedScore();
    const score = (await res.json()) as CreatorScore;
    cacheScore(score);
    return score;
  } catch {
    return getCachedScore();
  }
}

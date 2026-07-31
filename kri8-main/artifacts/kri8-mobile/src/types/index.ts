export * from './api';

// ── App-local types ────────────────────────────────────────────

/** A mutation that couldn't be sent while offline and is queued for retry. */
export interface QueuedMutation {
  id: string;
  timestamp: number;
  method: 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  retryCount: number;
  maxRetries: number;
}

/** Generic pagination cursor for list responses. */
export interface PaginationParams {
  before?: number;
  limit?: number;
}

/** Result from a paginated list API. */
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
}

/** App notification types (local, not push). */
export type AppNotificationType =
  | 'trend_accelerating'
  | 'idle_reminder'
  | 'collaborator_done'
  | 'trend_momentum'
  | 'schedule_tomorrow'
  | 'friend_accepted'
  | 'new_message';

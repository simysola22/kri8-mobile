/**
 * SyncEngine hook.
 *
 * Watches network state and drains the offline mutation queue
 * when connectivity returns. Call once in the root layout.
 *
 * Phase 2.5 additions:
 *  - Broadcasts sync status via a module-level event emitter so
 *    useSyncStatus can reflect current state without prop drilling.
 *  - Supports AppState changes (app resume → re-sync).
 *  - Background fetch is registered separately via registerBackgroundSync().
 */
import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';
import {
  getQueue,
  dequeue,
  incrementRetry,
  getQueueSize,
} from '@/stores/offlineQueue';
import { analytics } from '@/services/analytics/AnalyticsService';
import type { QueuedMutation } from '@/types';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

type SyncStateListener = (isSyncing: boolean) => void;
const syncStateListeners = new Set<SyncStateListener>();

export function subscribeSyncState(listener: SyncStateListener): () => void {
  syncStateListeners.add(listener);
  return () => syncStateListeners.delete(listener);
}

function broadcastSyncState(isSyncing: boolean): void {
  syncStateListeners.forEach((listener) => listener(isSyncing));
}

// ── Internal sync runner (exported for background fetch use) ───

export async function runSync(getToken: () => Promise<string | null>): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const token = await getToken();
  if (!token) return;

  let successCount = 0;
  let failCount = 0;

  for (const mutation of queue) {
    try {
      await replayMutation(mutation, token);
      dequeue(mutation.id);
      successCount++;
    } catch (error) {
      const status =
        error instanceof Error &&
        typeof (error as Error & { status?: unknown }).status === 'number'
          ? (error as Error & { status: number }).status
          : undefined;

      // Client errors are permanent for this payload. Retrying them on every
      // reconnect hides invalid input and needlessly drains the queue.
      if (status !== undefined && status >= 400 && status < 500) {
        dequeue(mutation.id);
        failCount++;
        continue;
      }

      const stillQueued = incrementRetry(mutation.id);
      if (!stillQueued) {
        console.warn(`[SyncEngine] Dropped mutation ${mutation.id} after max retries`);
      }
      failCount++;
    }
  }

  if (successCount > 0) {
    analytics.track('offline_sync_completed', { successCount, failCount });
  } else if (failCount > 0) {
    analytics.track('offline_sync_failed', { failCount });
  }
}

async function replayMutation(
  mutation: QueuedMutation,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api${mutation.path}`, {
    method: mutation.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: mutation.body ? JSON.stringify(mutation.body) : undefined,
  });
  if (!res.ok) {
    const error = new Error(`Sync failed: ${res.status}`);
    Object.assign(error, { status: res.status });
    throw error;
  }
}

// ── Hook ───────────────────────────────────────────────────────

export function useOfflineSync() {
  const { getToken, isSignedIn } = useAuth();
  const isSyncing = useRef(false);

  const drainQueue = useCallback(async () => {
    if (isSyncing.current || !isSignedIn) return;
    if (getQueueSize() === 0) return;

    isSyncing.current = true;
    broadcastSyncState(true);
    try {
      await runSync(getToken);
    } finally {
      isSyncing.current = false;
      broadcastSyncState(false);
    }
  }, [getToken, isSignedIn]);

  // ── Network reconnect ───────────────────────────────────────
  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const isOnline =
        state.isConnected === true && state.isInternetReachable === true;
      if (isOnline && getQueueSize() > 0) {
        void drainQueue();
      }
    });

    // Drain on mount
    void drainQueue();

    return () => unsubscribeNet();
  }, [drainQueue]);

  // ── App resume (foreground) ─────────────────────────────────
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && getQueueSize() > 0) {
        void drainQueue();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [drainQueue]);

  return { drainQueue };
}

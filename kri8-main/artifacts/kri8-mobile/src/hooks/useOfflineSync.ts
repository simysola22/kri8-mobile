/**
 * SyncEngine hook.
 *
 * Watches network state and drains the offline mutation queue
 * when connectivity returns. Call once in the root layout.
 */
import { useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';
import {
  getQueue,
  dequeue,
  incrementRetry,
  getQueueSize,
} from '@/stores/offlineQueue';
import type { QueuedMutation } from '@/types';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

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
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
}

export function useOfflineSync() {
  const { getToken, isSignedIn } = useAuth();
  const isSyncing = useRef(false);

  const drainQueue = useCallback(async () => {
    if (isSyncing.current || !isSignedIn) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    isSyncing.current = true;
    const token = await getToken();
    if (!token) {
      isSyncing.current = false;
      return;
    }

    for (const mutation of queue) {
      try {
        await replayMutation(mutation, token);
        dequeue(mutation.id);
      } catch {
        const stillQueued = incrementRetry(mutation.id);
        if (!stillQueued) {
          console.warn(`[SyncEngine] Dropped mutation ${mutation.id} after max retries`);
        }
      }
    }

    isSyncing.current = false;
  }, [getToken, isSignedIn]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline =
        state.isConnected === true && state.isInternetReachable === true;
      if (isOnline && getQueueSize() > 0) {
        void drainQueue();
      }
    });

    // Also try draining on mount
    void drainQueue();

    return () => unsubscribe();
  }, [drainQueue]);

  return { drainQueue };
}

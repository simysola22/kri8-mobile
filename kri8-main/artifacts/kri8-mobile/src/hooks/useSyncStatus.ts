/**
 * useSyncStatus
 *
 * Exposes the current background sync state so UI can show subtle indicators.
 * Reads from the offlineQueue and listens to network changes.
 */
import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getQueueSize } from '@/stores/offlineQueue';
import { subscribeSyncState } from './useOfflineSync';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

export interface UseSyncStatusResult {
  status: SyncStatus;
  pendingCount: number;
  isOnline: boolean;
}

export function useSyncStatus(): UseSyncStatusResult {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(() => {
    setPendingCount(getQueueSize());
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribeSync = subscribeSyncState(setIsSyncing);
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
      refresh();
    });
    return () => {
      unsubscribe();
      unsubscribeSync();
    };
  }, [refresh]);

  // Poll queue size while the app is active so the indicator stays accurate
  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  let status: SyncStatus;
  if (!isOnline) status = 'offline';
  else if (isSyncing) status = 'syncing';
  else if (pendingCount > 0) status = 'pending';
  else status = 'synced';

  return { status, pendingCount, isOnline };
}

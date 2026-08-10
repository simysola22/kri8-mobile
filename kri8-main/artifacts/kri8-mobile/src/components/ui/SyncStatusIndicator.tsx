/**
 * SyncStatusIndicator
 *
 * Subtle inline indicator for background sync state.
 * Never interrupts the user — shows as a small badge or dot.
 *
 * Usage:
 *   <SyncStatusIndicator />
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useActiveTheme } from '@/stores/theme';

export function SyncStatusIndicator({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const { status, pendingCount } = useSyncStatus();
  const theme = useActiveTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  // Pulse animation while syncing
  useEffect(() => {
    if (status === 'syncing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      opacity.setValue(1);
    }
  }, [status, opacity]);

  // Don't show anything when fully synced and online
  if (status === 'synced' && !alwaysVisible) return null;

  const config = {
    offline: { color: theme.error, label: 'Offline', dot: '●' },
    syncing: { color: theme.warning, label: 'Syncing…', dot: '↺' },
    pending: { color: theme.warning, label: `${pendingCount} pending`, dot: '●' },
    synced: { color: theme.success, label: 'Synchronized', dot: '●' },
  }[status];

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={[styles.dot, { color: config.color }]}>{config.dot}</Text>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    fontSize: 8,
    lineHeight: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

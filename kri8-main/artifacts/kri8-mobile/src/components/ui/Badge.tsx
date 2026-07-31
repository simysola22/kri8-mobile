import React, { type ReactNode } from 'react';
import { Text, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useActiveTheme } from '@/stores/theme';

type BadgeVariant = 'accent' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = 'accent', style }: BadgeProps) {
  const theme = useActiveTheme();

  const bgColor: Record<BadgeVariant, string> = {
    accent: theme.accentSoft,
    success: `${theme.success}22`,
    warning: `${theme.warning}22`,
    error: `${theme.error}22`,
    muted: 'rgba(128,128,128,0.15)',
  };

  const textColor: Record<BadgeVariant, string> = {
    accent: theme.accent,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    muted: theme.textMuted,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgColor[variant] }, style]}>
      <Text style={[styles.text, { color: textColor[variant] }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

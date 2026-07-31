import React from 'react';
import { ActivityIndicator, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useActiveTheme } from '@/stores/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
  /** If true, centers in available space with flex: 1 */
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  style,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const theme = useActiveTheme();

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        <ActivityIndicator size={size} color={theme.accent} />
      </View>
    );
  }

  return (
    <ActivityIndicator
      size={size}
      color={theme.accent}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useActiveTheme } from '@/stores/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override blur intensity (defaults to theme value). */
  blur?: number;
  /** Don't apply padding — useful when the card contains a full-width image. */
  noPadding?: boolean;
  /** Apply a stronger glass surface (bgGlassDeep). */
  deep?: boolean;
}

/**
 * Glassmorphism card — the primary surface primitive.
 * Renders a blurred, semi-transparent card with a subtle border.
 */
export function GlassCard({
  children,
  style,
  blur,
  noPadding = false,
  deep = false,
}: GlassCardProps) {
  const theme = useActiveTheme();
  const blurIntensity = blur ?? theme.blur;

  return (
    <View style={[styles.wrapper, { borderColor: theme.border }, style]}>
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      {/* Tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: deep ? theme.bgGlassDeep : theme.bgGlass,
            borderRadius: 20,
          },
        ]}
      />
      <View style={noPadding ? undefined : styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    padding: 16,
  },
});

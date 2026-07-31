import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useActiveTheme } from '@/stores/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 11,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 36,
};

/**
 * Circular avatar with image or initials fallback.
 */
export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const theme = useActiveTheme();
  const [imgError, setImgError] = useState(false);
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const initials = getInitials(name);
  const showImage = !!uri && !imgError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.accentSoft,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: theme.accent }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
  },
});

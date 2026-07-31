import React, { useCallback, type ReactNode } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { pressIn, pressOut } from '@/lib/animations';
import { tapLight, tapMedium } from '@/lib/haptics';
import { useActiveTheme } from '@/stores/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface GlassButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function GlassButton({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: GlassButtonProps) {
  const theme = useActiveTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = pressIn();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = pressOut();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (variant === 'danger') {
      void tapMedium();
    } else {
      void tapLight();
    }
    onPress();
  }, [onPress, variant]);

  const isDisabled = disabled || loading;

  const sizeStyle = SIZE_STYLES[size];
  const textSizeStyle = TEXT_SIZE_STYLES[size];

  return (
    <Animated.View
      style={[
        animatedStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[styles.button, sizeStyle, style]}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={theme.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {(variant === 'secondary' || variant === 'ghost') && (
          <>
            <BlurView
              intensity={theme.blur}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor:
                    variant === 'ghost' ? 'transparent' : theme.bgGlass,
                  borderRadius: sizeStyle.borderRadius,
                },
              ]}
            />
          </>
        )}

        {variant === 'danger' && (
          <LinearGradient
            colors={['#FF6B8E', '#CC1A44']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'primary' || variant === 'danger'
                ? '#FFFFFF'
                : theme.text
            }
          />
        ) : (
          <Text
            style={[
              styles.text,
              textSizeStyle,
              {
                color:
                  variant === 'primary' || variant === 'danger'
                    ? '#FFFFFF'
                    : theme.text,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const SIZE_STYLES: Record<Size, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  md: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14 },
  lg: { paddingVertical: 18, paddingHorizontal: 28, borderRadius: 16 },
};

const TEXT_SIZE_STYLES: Record<Size, TextStyle> = {
  sm: { fontSize: 13, fontWeight: '600' },
  md: { fontSize: 15, fontWeight: '700' },
  lg: { fontSize: 17, fontWeight: '700' },
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  text: {
    letterSpacing: 0.2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
});

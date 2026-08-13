import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useActiveTheme } from '@/stores/theme';
import { selectionChanged } from '@/lib/haptics';
import { SPRING_BOUNCY } from '@/lib/animations';

// ── Icons (emoji fallback until vector icons are added in Phase 3) ──
// Keys are the real Expo Router route names (nested index routes live in folders).
const TAB_ICONS: Record<string, string> = {
  index: '✦',
  'ideas/index': '💡',
  capture: '⊕',
  'community/index': '◎',
  ai: '◈',
  'profile/index': '○',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  'ideas/index': 'Ideas',
  capture: 'Capture',
  'community/index': 'Community',
  ai: 'AI',
  'profile/index': 'Profile',
};

// Explicit order of the primary tabs. Any other registered route (detail
// screens, hidden `search`) is intentionally excluded from the tab bar.
const TAB_ORDER = [
  'index',
  'ideas/index',
  'capture',
  'community/index',
  'ai',
  'profile/index',
] as const;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <BlurView
        intensity={theme.blur}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme.tabBarBg },
        ]}
      />
      <View style={styles.row}>
        {TAB_ORDER.map((name) => {
          const route = state.routes.find((r) => r.name === name);
          if (!route) return null;
          const isFocused = state.routes[state.index]?.name === name;
          const isCapture = name === 'capture';

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              isCapture={isCapture}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  void selectionChanged();
                  navigation.navigate(route.name as never);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  isCapture: boolean;
  onPress: () => void;
}

function TabItem({ routeName, isFocused, isCapture, onPress }: TabItemProps) {
  const theme = useActiveTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING_BOUNCY);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  }, [scale]);

  const icon = TAB_ICONS[routeName] ?? '●';
  const label = TAB_LABELS[routeName] ?? routeName;
  const activeColor = theme.tabBarActive;
  const inactiveColor = theme.tabBarInactive;

  if (isCapture) {
    return (
      <Animated.View style={[styles.tabItem, animatedStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.captureButton}
        >
          <LinearGradient
            colors={theme.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.captureGradient}
          >
            <Text style={styles.captureIcon}>{icon}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.label, { color: isFocused ? activeColor : inactiveColor }]}>
          {label}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.tabItem, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.tabTouchable}
      >
        <Text
          style={[
            styles.icon,
            { color: isFocused ? activeColor : inactiveColor },
          ]}
        >
          {icon}
        </Text>
        {isFocused && (
          <View style={[styles.activeDot, { backgroundColor: activeColor }]} />
        )}
      </TouchableOpacity>
      <Text
        style={[
          styles.label,
          { color: isFocused ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 36,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -6,
  },
  captureIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

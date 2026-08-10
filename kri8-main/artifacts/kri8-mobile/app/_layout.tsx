import React, { useEffect } from 'react';
import { View, Text, Platform, StyleSheet, AppState, Alert } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokenCache } from '@/lib/tokenCache';
import { queryClient } from '@/api/queryClient';
import { ThemeProvider, useActiveTheme } from '@/stores/theme';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { analytics } from '@/services/analytics/AnalyticsService';
import { setupNotifications, onNotificationAction } from '@/services/NotificationService';
import { parseDeepLink, routeToExpoPath } from '@/lib/deepLinking';
import { useBiometric } from '@/hooks/useBiometric';
import { GlassButton } from '@/components/ui/GlassButton';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// ── Setup screen (shown when Clerk is not configured) ─────────
function SetupScreen() {
  return (
    <View style={styles.setup}>
      <Text style={styles.setupEmoji}>🔑</Text>
      <Text style={styles.setupTitle}>Kri8 Mobile</Text>
      <Text style={styles.setupSubtitle}>Finish connecting your workspace</Text>
      <View style={styles.setupCard}>
        <Text style={styles.setupCode}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>
        <Text style={styles.setupHint}>
          Add your Clerk publishable key (pk_test_…) to the mobile app
          environment, then restart Metro. The app can still open safely while
          this setup is incomplete.
        </Text>
      </View>
    </View>
  );
}

// ── Auth guard — redirects based on sign-in state ─────────────
function AuthGuard() {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Start offline sync engine (Phase 2 — unchanged)
  useOfflineSync();

  // ── Analytics identity ──────────────────────────────────────
  useEffect(() => {
    if (isSignedIn && user) {
      analytics.identify(String(user.id), {
        name: user.fullName ?? '',
        email: user.primaryEmailAddress?.emailAddress ?? '',
      });
    } else if (!isSignedIn) {
      analytics.reset();
    }
  }, [isSignedIn, user]);

  // ── Push notifications setup ────────────────────────────────
  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Fire-and-forget — non-fatal if push token registration fails
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        // user.id is a string like "user_xxxxxxxx" — pass a stable numeric-ish identifier
        const numericId = Math.abs(user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
        await setupNotifications(token, numericId);
      } catch {
        // Notification permissions and device token registration are optional.
        // Never block the authenticated app if the device cannot register.
      }
    })();
  }, [isSignedIn, user, getToken]);

  // ── Notification action routing ─────────────────────────────
  useEffect(() => {
    const unsubscribe = onNotificationAction((action, data) => {
      switch (action) {
        case 'open_idea':
        case 'open': {
          const ideaId = data.ideaId;
          if (ideaId) router.push(`/(tabs)/ideas/${ideaId}` as never);
          break;
        }
        case 'reply': {
          const senderId = data.senderId;
          if (senderId) router.push(`/(tabs)/community` as never);
          break;
        }
        default:
          break;
      }

      // Route from deep link data if present
      if (data.deepLink && typeof data.deepLink === 'string') {
        const route = parseDeepLink(data.deepLink);
        if (route) router.push(routeToExpoPath(route) as never);
        analytics.track('deep_link_opened', { source: 'notification' });
      }
    });
    return unsubscribe;
  }, [router]);

  // ── Auth redirect ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <AppLockGate isSignedIn={isSignedIn} signOut={signOut}>
      <Slot />
    </AppLockGate>
  );
}

function AppLockGate({
  isSignedIn,
  signOut,
  children,
}: {
  isSignedIn: boolean | undefined;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const theme = useActiveTheme();
  const { isAvailable, isEnabled, authenticate, isChecking } = useBiometric();
  const [isLocked, setIsLocked] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackgrounded =
        appState.current === 'background' || appState.current === 'inactive';
      appState.current = nextState;
      if (wasBackgrounded && nextState === 'active' && isSignedIn && isEnabled && isAvailable) {
        setMessage('');
        setIsLocked(true);
      }
    });
    return () => subscription.remove();
  }, [isAvailable, isEnabled, isSignedIn]);

  React.useEffect(() => {
    if (!isLocked || !isSignedIn || !isEnabled || !isAvailable) {
      if (!isEnabled || !isAvailable) setIsLocked(false);
      return;
    }
    void authenticate('Unlock Kri8').then((result) => {
      if (result.success) {
        setMessage('');
        setIsLocked(false);
      } else {
        setMessage(
          result.error === 'user_cancel' ? 'Unlock was cancelled.' : 'We could not verify your identity.',
        );
      }
    });
  }, [authenticate, isAvailable, isEnabled, isLocked, isSignedIn]);

  if (!isLocked || !isSignedIn || isChecking) return <>{children}</>;

  return (
    <View style={[styles.lockScreen, { backgroundColor: theme.bg }]}>
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={[styles.lockTitle, { color: theme.text }]}>Kri8 is locked</Text>
      <Text style={[styles.lockMessage, { color: theme.textMuted }]}>
        {message || 'Authenticate to continue.'}
      </Text>
      <GlassButton
        fullWidth
        onPress={() => {
          setMessage('');
          void authenticate('Unlock Kri8').then((result) => {
            if (result.success) setIsLocked(false);
            else setMessage('Unlock was cancelled or unsuccessful.');
          });
        }}
      >
        Try again
      </GlassButton>
      <GlassButton
        fullWidth
        variant="secondary"
        onPress={() => {
          Alert.alert(
            'Use account sign-in instead?',
            'You will sign out and can unlock Kri8 with your account credentials.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: () => void signOut(),
              },
            ],
          );
        }}
      >
        Use account sign-in instead
      </GlassButton>
    </View>
  );
}

// ── Status bar that follows the active theme ──────────────────
function ThemedStatusBar() {
  const theme = useActiveTheme();
  return <StatusBar style={theme.statusBar === 'dark-content' ? 'dark' : 'light'} />;
}

// ── Root layout ───────────────────────────────────────────────
export default function RootLayout() {
  if (!PUBLISHABLE_KEY) {
    return <SetupScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <ThemedStatusBar />
                <AuthGuard />
              </ThemeProvider>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  setup: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  setupEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  setupSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  setupCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    gap: 10,
  },
  setupCode: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '600',
  },
  setupHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  lockIcon: { fontSize: 52, marginBottom: 8 },
  lockTitle: { fontSize: 28, fontWeight: '800' },
  lockMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
});

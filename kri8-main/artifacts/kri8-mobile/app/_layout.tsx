import React, { useEffect } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokenCache } from '@/lib/tokenCache';
import { queryClient } from '@/api/queryClient';
import { ThemeProvider, useActiveTheme } from '@/stores/theme';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// On native, crash early so developers see the error immediately.
// On web, render a setup screen instead.
if (!PUBLISHABLE_KEY && Platform.OS !== 'web') {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env.local and fill in your Clerk publishable key.',
  );
}

// ── Setup screen (web-only, shown when Clerk key is not configured) ──
function SetupScreen() {
  return (
    <View style={styles.setup}>
      <Text style={styles.setupEmoji}>🔑</Text>
      <Text style={styles.setupTitle}>Kri8 Mobile</Text>
      <Text style={styles.setupSubtitle}>One environment variable needed</Text>
      <View style={styles.setupCard}>
        <Text style={styles.setupCode}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>
        <Text style={styles.setupHint}>
          Add your Clerk publishable key (pk_test_…) as a Replit Secret, then
          restart the workflow.
        </Text>
      </View>
    </View>
  );
}

// ── Auth guard — redirects based on sign-in state ─────────────
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Start offline sync engine
  useOfflineSync();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return <Slot />;
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
});

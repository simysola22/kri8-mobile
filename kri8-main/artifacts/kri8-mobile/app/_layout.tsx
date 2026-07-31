import React, { useEffect } from 'react';
import { View } from 'react-native';
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

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env.local and fill in your Clerk publishable key.',
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

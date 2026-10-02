import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { PublicProfile } from '@/types';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

class ProfileApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ProfileApiError';
    this.status = status;
    this.code = code;
  }
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const normalizedUsername = Array.isArray(username) ? username[0] : username;
  const { data: profile, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['profile', normalizedUsername?.toLowerCase()],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/profile/${encodeURIComponent(normalizedUsername!.trim().toLowerCase())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let body: { error?: unknown; code?: unknown } = {};
        try {
          body = await res.json() as typeof body;
        } catch {
          // Use the HTTP status when the server has no JSON response.
        }
        throw new ProfileApiError(
          typeof body.error === 'string' ? body.error : res.status === 404 ? 'Profile not found' : 'Could not load this profile',
          res.status,
          typeof body.code === 'string' ? body.code : undefined,
        );
      }
      return res.json() as Promise<PublicProfile>;
    },
    enabled: !!normalizedUsername?.trim(),
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      {!profile ? (
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: theme.text }]}>
            {error instanceof ProfileApiError && error.code === 'PROFILE_PRIVATE'
              ? 'This profile is private'
              : error instanceof ProfileApiError && error.status >= 500
                ? 'Profile could not load'
                : 'Profile not found'}
          </Text>
          <Text style={[styles.notFoundSubtext, { color: theme.textMuted }]}>
            {error instanceof ProfileApiError && error.code === 'PROFILE_PRIVATE'
              ? 'This creator has chosen not to share their ideas publicly.'
              : error instanceof ProfileApiError && error.status >= 500
                ? 'Check your connection and try again.'
                : 'The username may have changed or the profile is no longer available.'}
          </Text>
          {error instanceof ProfileApiError && error.status >= 500 && (
            <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: theme.accent }]}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.headerCard}>
            <Avatar
              uri={profile.user.avatarUrl}
              name={profile.user.name ?? profile.user.username}
              size="xl"
            />
            <Text style={[styles.name, { color: theme.text }]}>
              {profile.user.name ?? '@' + profile.user.username}
            </Text>
            {profile.user.username && (
              <Text style={[styles.handle, { color: theme.textMuted }]}>
                @{profile.user.username}
              </Text>
            )}
            {profile.user.bio && (
              <Text style={[styles.bio, { color: theme.textMuted }]}>
                {profile.user.bio}
              </Text>
            )}
          </GlassCard>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Public Ideas
          </Text>

          {profile.ideas.map((idea) => (
            <GlassCard key={idea.id} style={styles.ideaCard}>
              <Text style={[styles.ideaTitle, { color: theme.text }]}>
                {idea.title}
              </Text>
              {idea.insight && (
                <Text
                  style={[styles.ideaInsight, { color: theme.textMuted }]}
                  numberOfLines={2}
                >
                  {idea.insight}
                </Text>
              )}
              {idea.isUsed && <Badge variant="success">Used</Badge>}
            </GlassCard>
          ))}

          {profile.ideas.length === 0 && (
            <Text style={[styles.empty, { color: theme.textFaint }]}>
              No public ideas yet.
            </Text>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: { paddingHorizontal: 20, paddingBottom: 8 },
  back: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  headerCard: { alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '800' },
  handle: { fontSize: 15, marginTop: -4 },
  bio: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  ideaCard: { gap: 6 },
  ideaTitle: { fontSize: 16, fontWeight: '600' },
  ideaInsight: { fontSize: 13 },
  empty: { fontSize: 15, textAlign: 'center', paddingTop: 32 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  notFoundSubtext: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 30 },
  retryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 15, fontWeight: '700' },
});

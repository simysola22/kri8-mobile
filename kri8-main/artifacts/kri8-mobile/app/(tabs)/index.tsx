import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrentUser } from '@/hooks/useUser';
import { useRecentIdeas, useIdeaStats } from '@/hooks/useIdeas';

export default function HomeScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const { data: user } = useCurrentUser();
  const { data: stats } = useIdeaStats();
  const { data: recent, isLoading, refetch, isRefetching } = useRecentIdeas(6);

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textMuted }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {user?.name ?? user?.username ?? 'Creator'}
            </Text>
          </View>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.name ?? user?.username}
            size="md"
          />
        </View>

        {/* Stats strip */}
        {stats && (
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatItem
                label="Total"
                value={stats.total}
                accent={theme.accent}
                text={theme.text}
                muted={theme.textMuted}
              />
              <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />
              <StatItem
                label="Used"
                value={stats.used}
                accent={theme.success}
                text={theme.text}
                muted={theme.textMuted}
              />
              <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />
              <StatItem
                label="This Week"
                value={stats.createdThisWeek}
                accent={theme.accentSoft}
                text={theme.text}
                muted={theme.textMuted}
              />
              <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />
              <StatItem
                label="Branches"
                value={stats.totalBranches}
                accent={theme.textMuted}
                text={theme.text}
                muted={theme.textMuted}
              />
            </View>
          </GlassCard>
        )}

        {/* Recent ideas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Ideas
          </Text>
          {isLoading ? (
            <LoadingSpinner style={{ marginTop: 32 }} />
          ) : (recent ?? []).length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={[styles.emptyIcon]}>💡</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No ideas yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Tap Capture to add your first idea
              </Text>
            </GlassCard>
          ) : (
            (recent ?? []).map((idea) => (
              <GlassCard key={idea.id} style={styles.ideaCard}>
                <View style={styles.ideaHeader}>
                  <Text
                    style={[styles.ideaTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {idea.title}
                  </Text>
                  {idea.isUsed && (
                    <Badge variant="success">Used</Badge>
                  )}
                </View>
                {idea.insight ? (
                  <Text
                    style={[styles.ideaInsight, { color: theme.textMuted }]}
                    numberOfLines={2}
                  >
                    {idea.insight}
                  </Text>
                ) : null}
                <Text style={[styles.ideaDate, { color: theme.textFaint }]}>
                  {formatDate(idea.createdAt)}
                </Text>
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function StatItem({
  label,
  value,
  accent,
  text,
  muted,
}: {
  label: string;
  value: number;
  accent: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  name: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statsCard: { marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  statsDivider: { width: 1, height: 36 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  ideaCard: { gap: 6 },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  ideaTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  ideaInsight: { fontSize: 13, lineHeight: 18 },
  ideaDate: { fontSize: 11, marginTop: 2 },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

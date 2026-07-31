import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useIdeas } from '@/hooks/useIdeas';
import type { Idea } from '@/types';

export default function IdeasScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filterUsed, setFilterUsed] = useState<boolean | undefined>(undefined);

  const { data: ideas, isLoading, refetch, isRefetching } = useIdeas({
    search: search.length >= 2 ? search : undefined,
    is_used: filterUsed,
  });

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Ideas</Text>

        {/* Search */}
        <TextInput
          style={[
            styles.search,
            {
              backgroundColor: theme.bgGlass,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search ideas…"
          placeholderTextColor={theme.textFaint}
          clearButtonMode="while-editing"
        />

        {/* Filter chips */}
        <View style={styles.filters}>
          {[
            { label: 'All', value: undefined },
            { label: 'Unused', value: false },
            { label: 'Used', value: true },
          ].map(({ label, value }) => (
            <TouchableOpacity
              key={label}
              onPress={() => setFilterUsed(value)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    filterUsed === value ? theme.accentSoft : theme.bgGlass,
                  borderColor:
                    filterUsed === value ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filterUsed === value ? theme.accent : theme.textMuted },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={ideas ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={theme.accent}
            />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <IdeaRow idea={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyIcon]}>💡</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {search ? 'No ideas match your search' : 'No ideas yet'}
              </Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  const theme = useActiveTheme();
  return (
    <Link href={`/(tabs)/ideas/${idea.id}`} asChild>
      <TouchableOpacity activeOpacity={0.85}>
        <GlassCard style={styles.ideaCard}>
          <View style={styles.ideaRow}>
            <View style={styles.ideaMeta}>
              <Text
                style={[styles.ideaTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {idea.title}
              </Text>
              {idea.insight ? (
                <Text
                  style={[styles.ideaInsight, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {idea.insight}
                </Text>
              ) : null}
            </View>
            <View style={styles.ideaBadges}>
              {idea.isUsed && <Badge variant="success">✓</Badge>}
              {idea.branchCount > 0 && (
                <Badge variant="muted">{idea.branchCount}</Badge>
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  ideaCard: {},
  ideaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ideaMeta: { flex: 1, gap: 3 },
  ideaTitle: { fontSize: 16, fontWeight: '600' },
  ideaInsight: { fontSize: 13 },
  ideaBadges: { gap: 4, alignItems: 'flex-end' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16 },
});

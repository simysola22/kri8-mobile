import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UniversalSearchBar } from '@/components/ui/UniversalSearchBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useActiveTheme } from '@/stores/theme';
import * as SearchService from '@/services/SearchService';

export default function SearchScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [recent, setRecent] = useState(() => SearchService.getRecentSearches());
  const [selectedRecent, setSelectedRecent] = useState<string | undefined>();

  const handleResultPress = useCallback(
    (route: string, item: SearchService.SearchResultItem) => {
      SearchService.saveRecentSearch(item.title);
      setRecent(SearchService.getRecentSearches());
      setSelectedRecent(undefined);
      router.push(route as never);
    },
    [router],
  );

  const handleRecentPress = useCallback((query: string) => {
    SearchService.saveRecentSearch(query);
    setRecent(SearchService.getRecentSearches());
    setSelectedRecent(query);
  }, []);

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={[styles.back, { color: theme.accent }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>Search</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
               Find ideas, people, and trends
            </Text>
            <UniversalSearchBar
              onResultPress={handleResultPress}
              autoFocus
              initialQuery={selectedRecent}
            />
            {recent.length > 0 && (
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent searches
                </Text>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    SearchService.clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Clear
                </GlassButton>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleRecentPress(item)}
            style={[styles.recentItem, { borderBottomColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Search again for ${item}`}
          >
            <Text style={[styles.recentIcon, { color: theme.textMuted }]}>↺</Text>
            <Text style={[styles.recentText, { color: theme.text }]} numberOfLines={1}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <GlassCard style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Search across Kri8
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
               Results are grouped by ideas, people/community, and trends.
            </Text>
          </GlassCard>
        }
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 8 },
  header: { gap: 10, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { fontSize: 38, lineHeight: 38, fontWeight: '300' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 15, marginBottom: 6 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentIcon: { fontSize: 18 },
  recentText: { fontSize: 15, flex: 1 },
  empty: { alignItems: 'center', gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
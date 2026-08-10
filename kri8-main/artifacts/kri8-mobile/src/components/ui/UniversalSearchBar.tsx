/**
 * UniversalSearchBar
 *
 * Single search input that searches across all content categories.
 * Results are grouped and rendered below the input.
 *
 * Usage:
 *   <UniversalSearchBar onResultPress={(route) => router.push(route)} />
 */
import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
import { useActiveTheme } from '@/stores/theme';
import type { SearchResultItem, SearchGroup } from '@/services/SearchService';

interface UniversalSearchBarProps {
  placeholder?: string;
  onResultPress?: (route: string, item: SearchResultItem) => void;
  autoFocus?: boolean;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
}

export function UniversalSearchBar({
  placeholder = 'Search ideas, friends, trends…',
  onResultPress,
  autoFocus,
  onQueryChange,
  initialQuery,
}: UniversalSearchBarProps) {
  const theme = useActiveTheme();
  const { query, setQuery, results, isLoading, isError, clear } = useUniversalSearch();
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  const hasResults = (results?.totalCount ?? 0) > 0;
  const showEmpty = query.length > 1 && !isLoading && !hasResults;

  return (
    <View style={styles.wrapper}>
      {/* ── Input ── */}
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.bgGlass, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.searchIcon, { color: theme.textMuted }]}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            onQueryChange?.(value);
          }}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Universal search"
        />
        {isLoading && (
          <ActivityIndicator size="small" color={theme.accent} />
        )}
        {!isLoading && query.length > 0 && (
          <TouchableOpacity onPress={clear} accessibilityLabel="Clear search">
            <Text style={[styles.clearIcon, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Results ── */}
      {hasResults && results && (
        <View style={[styles.resultsContainer, { borderColor: theme.border }]}>
          <FlatList
            data={results.groups}
            keyExtractor={(g) => g.category}
            renderItem={({ item: group }) => (
              <SearchGroupSection
                group={group}
                theme={theme}
                onResultPress={onResultPress}
              />
            )}
            keyboardShouldPersistTaps="handled"
           ListFooterComponent={
             isError ? (
               <Text style={[styles.errorLabel, { color: theme.error }]}>
                 Some search sources are unavailable.
               </Text>
             ) : (
              <Text style={[styles.durationLabel, { color: theme.textFaint }]}>
                {results.totalCount} result{results.totalCount !== 1 ? 's' : ''} in {results.durationMs}ms
              </Text>
             )
            }
          />
        </View>
      )}

      {isError && showEmpty && (
        <View style={[styles.emptyState, { borderColor: theme.error }]}>
          <Text style={[styles.emptyText, { color: theme.error }]}>
            Search is temporarily unavailable. Try again.
          </Text>
        </View>
      )}

      {showEmpty && !isError && (
        <View style={[styles.emptyState, { borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No results for "{query}"
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Group section ─────────────────────────────────────────────

interface SearchGroupSectionProps {
  group: SearchGroup;
  theme: ReturnType<typeof useActiveTheme>;
  onResultPress?: (route: string, item: SearchResultItem) => void;
}

function SearchGroupSection({ group, theme, onResultPress }: SearchGroupSectionProps) {
  return (
    <View style={styles.groupSection}>
      <Text style={[styles.groupLabel, { color: theme.accent }]}>
        {group.label.toUpperCase()}
      </Text>
      {group.items.map((item) => (
        <TouchableOpacity
          key={`${item.category}-${item.id}`}
          style={[styles.resultItem, { borderBottomColor: theme.border }]}
           onPress={() => {
             Keyboard.dismiss();
             onResultPress?.(item.route, item);
           }}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.resultSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    paddingHorizontal: 2,
  },
  resultsContainer: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 400,
  },
  groupSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  emptyState: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  durationLabel: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorLabel: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTrendsDashboard, useGetInspiration, useAnalyzeTrend } from '@/hooks/useTrends';
import type { TrendInspiration, TrendAnalysis } from '@/types';

export default function AIScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();

  const { data: trends, isLoading: trendsLoading, refetch, isRefetching } = useTrendsDashboard();
  const getInspiration = useGetInspiration();
  const analyzeTrend = useAnalyzeTrend();

  const [analyzeTitle, setAnalyzeTitle] = useState('');
  const [inspiration, setInspiration] = useState<TrendInspiration | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

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
        <Text style={[styles.title, { color: theme.text }]}>AI Studio</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          Trends, inspiration, and AI-powered insights
        </Text>

        {/* Inspiration */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ✨ Get Inspired
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            AI generates ideas, hooks, and title patterns tailored for creators.
          </Text>
          <GlassButton
            onPress={() =>
              getInspiration.mutate(undefined, {
                onSuccess: (data) => setInspiration(data),
              })
            }
            loading={getInspiration.isPending}
            fullWidth
          >
            Inspire Me
          </GlassButton>

          {inspiration && (
            <View style={styles.results}>
              {inspiration.ideas.length > 0 && (
                <ResultGroup label="Ideas" items={inspiration.ideas} variant="accent" />
              )}
              {inspiration.hooks.length > 0 && (
                <ResultGroup label="Hooks" items={inspiration.hooks} variant="success" />
              )}
              {inspiration.titlePatterns.length > 0 && (
                <ResultGroup label="Title Patterns" items={inspiration.titlePatterns} variant="muted" />
              )}
            </View>
          )}
        </GlassCard>

        {/* Trend analysis */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📊 Analyze an Idea
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.bgGlassDeep,
                borderColor: analyzeTitle ? theme.borderActive : theme.border,
                color: theme.text,
              },
            ]}
            value={analyzeTitle}
            onChangeText={setAnalyzeTitle}
            placeholder="Paste an idea title…"
            placeholderTextColor={theme.textFaint}
            multiline
          />
          <GlassButton
            onPress={() =>
              analyzeTrend.mutate(
                { title: analyzeTitle },
                { onSuccess: (data) => setAnalysis(data) },
              )
            }
            loading={analyzeTrend.isPending}
            disabled={!analyzeTitle.trim()}
            fullWidth
          >
            Analyze
          </GlassButton>

          {analysis && (
            <View style={styles.results}>
              <View style={styles.relevanceRow}>
                <Text style={[styles.relevanceLabel, { color: theme.textMuted }]}>
                  Trend Relevance
                </Text>
                <Text style={[styles.relevanceScore, { color: theme.accent }]}>
                  {analysis.relevance}/100
                </Text>
              </View>
              {analysis.opportunities.length > 0 && (
                <ResultGroup label="Opportunities" items={analysis.opportunities} variant="success" />
              )}
              {analysis.suggestedAngles.length > 0 && (
                <ResultGroup label="Angles" items={analysis.suggestedAngles} variant="accent" />
              )}
            </View>
          )}
        </GlassCard>

        {/* Trending topics */}
        {trendsLoading ? (
          <LoadingSpinner />
        ) : trends ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              🔥 Trending Now
            </Text>
            <View style={styles.chipWrap}>
              {trends.hashtags.slice(0, 12).map((tag) => (
                <Badge key={tag.tag} variant="accent">
                  #{tag.tag}
                </Badge>
              ))}
            </View>
            {trends.topics.slice(0, 5).map((topic) => (
              <GlassCard key={topic.title} style={styles.topicCard}>
                <Text style={[styles.topicTitle, { color: theme.text }]}>
                  {topic.title}
                </Text>
                {topic.description && (
                  <Text style={[styles.topicDesc, { color: theme.textMuted }]}>
                    {topic.description}
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

function ResultGroup({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: 'accent' | 'success' | 'muted';
}) {
  const theme = useActiveTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{label}</Text>
      {items.map((item, i) => (
        <Text key={i} style={[styles.groupItem, { color: theme.text }]}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  sub: { fontSize: 15, marginTop: -8 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionSub: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 60,
  },
  results: { gap: 12, marginTop: 4 },
  relevanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relevanceLabel: { fontSize: 14, fontWeight: '600' },
  relevanceScore: { fontSize: 28, fontWeight: '800' },
  group: { gap: 6 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  groupItem: { fontSize: 14, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicCard: { gap: 4 },
  topicTitle: { fontSize: 15, fontWeight: '600' },
  topicDesc: { fontSize: 13, lineHeight: 18 },
});

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
  const [inspirationTitle, setInspirationTitle] = useState('');
  const [inspiration, setInspiration] = useState<TrendInspiration | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
           { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 112 },
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
            Get Inspired
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            AI generates ideas, hooks, and title patterns tailored for creators.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.bgGlassDeep,
                borderColor: inspirationTitle ? theme.borderActive : theme.border,
                color: theme.text,
              },
            ]}
            value={inspirationTitle}
            onChangeText={setInspirationTitle}
            placeholder="Describe an idea to inspire…"
            placeholderTextColor={theme.textFaint}
            multiline
          />
          <GlassButton
            onPress={() =>
              getInspiration.mutate(
                { title: inspirationTitle.trim() },
                { onSuccess: (data) => setInspiration(data) },
              )
            }
            loading={getInspiration.isPending}
            disabled={!inspirationTitle.trim()}
            fullWidth
          >
            Inspire Me
          </GlassButton>

          {inspiration && (
            <View style={styles.results}>
              {inspiration.relatedIdeas.length > 0 && (
                <ResultGroup label="Ideas" items={inspiration.relatedIdeas} variant="accent" />
              )}
              {inspiration.alternativeHooks.length > 0 && (
                <ResultGroup label="Hooks" items={inspiration.alternativeHooks} variant="success" />
              )}
              {inspiration.titleSuggestions.length > 0 && (
                <ResultGroup label="Title Suggestions" items={inspiration.titleSuggestions} variant="muted" />
              )}
            </View>
          )}
        </GlassCard>

        {/* Trend analysis */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Analyze an Idea
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
                  {analysis.relevanceScore}/100
                </Text>
              </View>
              {analysis.contentOpportunities.length > 0 && (
                <ResultGroup label="Opportunities" items={analysis.contentOpportunities} variant="success" />
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
                Trending Now
              </Text>
            <View style={styles.chipWrap}>
              {trends.hashtags.slice(0, 12).map((tag) => (
                <Badge key={tag.tag} variant="accent">
                  #{tag.tag}
                </Badge>
              ))}
            </View>
            {trends.topics.slice(0, 5).map((topic) => (
              <GlassCard key={topic.id} style={styles.topicCard}>
                <Text style={[styles.topicTitle, { color: theme.text }]}>
                  {topic.name}
                </Text>
                <Text style={[styles.topicDesc, { color: theme.textMuted }]}>
                  {topic.category} · +{topic.growthPercent}% growth · {topic.platform}
                </Text>
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
  scroll: { paddingHorizontal: 22, gap: 22 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 },
  sub: { fontSize: 15, marginTop: -12, lineHeight: 22 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  sectionSub: { fontSize: 14, lineHeight: 21, marginTop: -4 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 76,
    lineHeight: 21,
  },
  results: { gap: 16, marginTop: 6 },
  relevanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relevanceLabel: { fontSize: 14, fontWeight: '600' },
  relevanceScore: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  group: { gap: 8 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  groupItem: { fontSize: 14, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicCard: { gap: 7 },
  topicTitle: { fontSize: 17, fontWeight: '600' },
  topicDesc: { fontSize: 13, lineHeight: 19 },
});

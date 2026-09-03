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

  const { data: trends, isLoading: trendsLoading, error: trendsError, refetch, isRefetching } = useTrendsDashboard();
  const getInspiration = useGetInspiration();
  const analyzeTrend = useAnalyzeTrend();

  const [analyzeTitle, setAnalyzeTitle] = useState('');
  const [inspirationTitle, setInspirationTitle] = useState('');
  const [inspiration, setInspiration] = useState<TrendInspiration | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  const runInspiration = () => {
    const title = inspirationTitle.trim();
    if (!title) return;
    setInspiration(null);
    getInspiration.mutate({ title }, { onSuccess: (data) => setInspiration(data) });
  };

  const runAnalysis = () => {
    const title = analyzeTitle.trim();
    if (!title) return;
    setAnalysis(null);
    analyzeTrend.mutate({ title }, { onSuccess: (data) => setAnalysis(data) });
  };

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
            onPress={runInspiration}
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
              {inspiration.audienceQuestions.length > 0 && (
                <ResultGroup label="Audience Questions" items={inspiration.audienceQuestions} variant="accent" />
              )}
            </View>
          )}
          {getInspiration.isError && (
            <ErrorNotice
              message={getErrorMessage(getInspiration.error, 'Inspiration failed.')}
              onRetry={runInspiration}
            />
          )}
          {!getInspiration.isPending && inspiration && !hasInspirationContent(inspiration) && (
            <EmptyNotice message="The inspiration provider returned no suggestions." />
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
            onPress={runAnalysis}
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
              {analysis.relatedTopics.length > 0 && (
                <ResultGroup label="Related Topics" items={analysis.relatedTopics.map((topic) => topic.name)} variant="accent" />
              )}
              {analysis.relatedHashtags.length > 0 && (
                <ResultGroup
                  label="Related Hashtags"
                  items={analysis.relatedHashtags.map((hashtag) => normalizeHashtag(hashtag.tag))}
                  variant="muted"
                />
              )}
              {analysis.contentOpportunities.length > 0 && (
                <ResultGroup label="Opportunities" items={analysis.contentOpportunities} variant="success" />
              )}
              {analysis.suggestedAngles.length > 0 && (
                <ResultGroup label="Angles" items={analysis.suggestedAngles} variant="accent" />
              )}
            </View>
          )}
          {analyzeTrend.isError && (
            <ErrorNotice
              message={getErrorMessage(analyzeTrend.error, 'Trend analysis failed.')}
              onRetry={runAnalysis}
            />
          )}
          {!analyzeTrend.isPending && analysis && !hasAnalysisContent(analysis) && (
            <EmptyNotice message="The analysis provider returned no additional insights." />
          )}
        </GlassCard>

        {/* Trending topics */}
        {trendsLoading ? (
          <LoadingSpinner />
        ) : trendsError ? (
          <ErrorNotice
            message={getErrorMessage(trendsError, 'Could not load trends.')}
            onRetry={() => void refetch()}
          />
        ) : trends ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Trending Now
            </Text>
            <Text style={[styles.metadata, { color: theme.textMuted }]}>
              {formatTrendMetadata(trends)}
            </Text>
            {trends.hashtags.length === 0 && trends.topics.length === 0 ? (
              <EmptyNotice message="No trend data is available yet." />
            ) : (
              <>
                <View style={styles.chipWrap}>
                  {trends.hashtags.slice(0, 12).map((tag) => (
                    <Badge key={tag.tag} variant="accent">
                      {normalizeHashtag(tag.tag)}
                    </Badge>
                  ))}
                </View>
                {trends.topics.slice(0, 5).map((topic) => (
                  <GlassCard key={topic.id} style={styles.topicCard}>
                    <Text style={[styles.topicTitle, { color: theme.text }]}>
                      {topic.name}
                    </Text>
                    <Text style={[styles.topicDesc, { color: theme.textMuted }]}>
                      {topic.category} · {trends.metricsQuality === 'measured' ? `+${topic.growthPercent}% growth` : `estimated activity: +${topic.growthPercent}%`} · {topic.platform}
                    </Text>
                  </GlassCard>
                ))}
              </>
            )}
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

function normalizeHashtag(tag: string): string {
  return `#${tag.replace(/^#+/, '')}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function hasInspirationContent(result: TrendInspiration): boolean {
  return [
    result.relatedIdeas,
    result.alternativeHooks,
    result.titleSuggestions,
    result.audienceQuestions,
  ].some((items) => items.length > 0);
}

function hasAnalysisContent(result: TrendAnalysis): boolean {
  return result.relatedTopics.length > 0 ||
    result.relatedHashtags.length > 0 ||
    result.contentOpportunities.length > 0 ||
    result.suggestedAngles.length > 0;
}

function formatTrendMetadata(trends: {
  provider: string;
  source: string;
  fetchedAt: string | null;
  isStatic: boolean;
  metricsQuality: string;
}): string {
  if (trends.isStatic) return 'Fixture data · Last updated: unavailable';
  const retrieved = trends.fetchedAt
    ? `Retrieved ${new Date(trends.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Retrieval time unavailable';
  const quality = trends.metricsQuality === 'measured' ? 'Measured metrics' : 'Estimated metrics';
  return `${trends.source || trends.provider} · ${retrieved} · ${quality}`;
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useActiveTheme();
  return (
    <GlassCard style={styles.errorCard}>
      <Text style={[styles.errorText, { color: theme.text }]}>{message}</Text>
      <GlassButton variant="secondary" onPress={onRetry}>Retry</GlassButton>
    </GlassCard>
  );
}

function EmptyNotice({ message }: { message: string }) {
  const theme = useActiveTheme();
  return <Text style={[styles.emptyText, { color: theme.textMuted }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 22 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 },
  sub: { fontSize: 15, marginTop: -12, lineHeight: 22 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  sectionSub: { fontSize: 14, lineHeight: 21, marginTop: -4 },
  metadata: { fontSize: 12, lineHeight: 18 },
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
  errorCard: { gap: 12, borderColor: 'rgba(248,113,113,0.35)' },
  errorText: { fontSize: 14, lineHeight: 20 },
  emptyText: { fontSize: 14, lineHeight: 20 },
});

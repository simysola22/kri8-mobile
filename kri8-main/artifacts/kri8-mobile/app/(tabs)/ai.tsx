import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTrendsDashboard, useGetInspiration, useAnalyzeTrend, useTrendContentBreakdown } from '@/hooks/useTrends';
import type { TrendInspiration, TrendAnalysis, TrendTopic } from '@/types';

export default function AIScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();

  const { data: trends, isLoading: trendsLoading, error: trendsError, refetch, isRefetching } = useTrendsDashboard();
  const getInspiration = useGetInspiration();
  const analyzeTrend = useAnalyzeTrend();

  const [analyzeTitle, setAnalyzeTitle] = useState('');
  const [analyzeNotes, setAnalyzeNotes] = useState('');
  const [inspirationTitle, setInspirationTitle] = useState('');
  const [inspirationNotes, setInspirationNotes] = useState('');
  const [inspiration, setInspiration] = useState<TrendInspiration | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TrendTopic | null>(null);
  const {
    data: trendBreakdown,
    isLoading: isBreakdownLoading,
    isError: isBreakdownError,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = useTrendContentBreakdown(selectedTopic);

  const runInspiration = () => {
    const title = inspirationTitle.trim();
    if (!title) return;
    setInspiration(null);
    getInspiration.mutate(
      { title, notes: inspirationNotes.trim() || undefined },
      { onSuccess: (data) => setInspiration(data) },
    );
  };

  const runAnalysis = () => {
    const title = analyzeTitle.trim();
    if (!title) return;
    setAnalysis(null);
    analyzeTrend.mutate(
      { title, notes: analyzeNotes.trim() || undefined },
      { onSuccess: (data) => setAnalysis(data) },
    );
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
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { backgroundColor: theme.bgGlassDeep, borderColor: theme.border, color: theme.text },
            ]}
            value={inspirationNotes}
            onChangeText={setInspirationNotes}
            placeholder="Add audience, platform, or constraints (optional)…"
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
              <Text style={[styles.sourceLabel, { color: theme.textMuted }]}>
                {inspiration.source === 'openai' ? 'Generated with OpenAI' : 'Generated with AI'}
              </Text>
              {inspiration.trendContextAvailable === false && (
                <Text style={[styles.modalHint, { color: theme.textMuted }]}>
                  Trend data was unavailable, so these suggestions use your idea and notes only.
                </Text>
              )}
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
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { backgroundColor: theme.bgGlassDeep, borderColor: theme.border, color: theme.text },
            ]}
            value={analyzeNotes}
            onChangeText={setAnalyzeNotes}
            placeholder="Add context, audience, or what you want to test (optional)…"
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
                  {analysis.relevanceScore === null ? '—' : `${analysis.relevanceScore}/100`}
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
              {analysis.formatAdaptations?.length > 0 && (
                <ResultGroup label="Format Adaptations" items={analysis.formatAdaptations} variant="muted" />
              )}
              {analysis.suggestedAngles.length > 0 && (
                <ResultGroup label="Angles" items={analysis.suggestedAngles} variant="accent" />
              )}
              {analysis.audienceFit && (
                <ResultGroup label="Audience Fit" items={[analysis.audienceFit]} variant="muted" />
              )}
              {analysis.differentiation && (
                <ResultGroup label="How to Stand Out" items={[analysis.differentiation]} variant="accent" />
              )}
              {analysis.recommendedHook && (
                <ResultGroup label="Recommended Hook" items={[analysis.recommendedHook]} variant="success" />
              )}
              {analysis.risks?.length ? (
                <ResultGroup label="Risks to Check" items={analysis.risks} variant="muted" />
              ) : null}
              <View style={styles.evidenceCard}>
                <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Evidence</Text>
                <Text style={[styles.evidenceTitle, { color: theme.text }]}>
                  {analysis.confidence === 'insufficient'
                    ? 'Insufficient trend evidence'
                    : `${analysis.confidence[0].toUpperCase()}${analysis.confidence.slice(1)} confidence`}
                </Text>
                {analysis.scoringEvidence.map((item) => (
                  <Text key={item} style={[styles.evidenceItem, { color: theme.textMuted }]}>• {item}</Text>
                ))}
              </View>
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
                  <TouchableOpacity
                    key={topic.id}
                    activeOpacity={0.84}
                    onPress={() => setSelectedTopic(topic)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open details for ${topic.name}`}
                  >
                  <GlassCard style={styles.topicCard}>
                    <Text style={[styles.topicTitle, { color: theme.text }]}>
                      {topic.name}
                    </Text>
                    <Text style={[styles.topicDesc, { color: theme.textMuted }]}>
                       {topic.category} · {formatTopicSignal(topic.growthPercent, trends.metricsQuality)} · {topic.platform} · Tap for details
                    </Text>
                  </GlassCard>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={selectedTopic !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTopic(null)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
            contentContainerStyle={styles.modalCardContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedTopic?.name}</Text>
            <Text style={[styles.modalMeta, { color: theme.textMuted }]}>
              {selectedTopic?.platform} · {selectedTopic?.category}
              {selectedTopic?.channelTitle ? ` · ${selectedTopic.channelTitle}` : ''}
            </Text>
            <View style={styles.metricRow}>
              <Metric label="Views" value={formatMetric(selectedTopic?.volume)} />
              <Metric label="Likes" value={formatMetric(selectedTopic?.likes)} />
              <Metric label="Comments" value={formatMetric(selectedTopic?.comments)} />
            </View>
            {selectedTopic?.description ? (
              <Text style={[styles.modalDescription, { color: theme.textMuted }]}>
                {selectedTopic.description}
              </Text>
            ) : (
              <Text style={[styles.modalDescription, { color: theme.textMuted }]}>
                Source details are limited for this trend. Open the source to inspect the original content.
              </Text>
            )}
            {isBreakdownLoading && (
              <View style={styles.breakdownLoading}>
                <LoadingSpinner size="small" />
                <Text style={[styles.modalHint, { color: theme.textMuted }]}>
                  Analyzing the public video details…
                </Text>
              </View>
            )}
            {isBreakdownError && (
              <View style={styles.breakdownError}>
                <Text style={[styles.modalDescription, { color: theme.textMuted }]}>
                  {getErrorMessage(breakdownError, 'Could not analyze this video.')}
                </Text>
                <GlassButton variant="secondary" onPress={() => void refetchBreakdown()}>
                  Retry breakdown
                </GlassButton>
              </View>
            )}
            {trendBreakdown && (
              <View style={styles.breakdown}>
                <ResultGroup label="Opening Hook (inferred)" items={[trendBreakdown.openingHook]} variant="success" />
                <ResultGroup label="Likely Structure (inferred)" items={trendBreakdown.structure} variant="accent" />
                <ResultGroup label="Why It May Work" items={trendBreakdown.whyItMayWork} variant="muted" />
                <ResultGroup label="Adapt It for Your Audience" items={[trendBreakdown.adaptationAngle]} variant="accent" />
                <Text style={[styles.modalHint, { color: theme.textMuted }]}>{trendBreakdown.evidenceNote}</Text>
              </View>
            )}
            <Text style={[styles.modalHint, { color: theme.textMuted }]}>
              Metrics come from the configured trend provider. Hook and structure recommendations are kept separate from measured metrics.
            </Text>
            {selectedTopic?.sourceUrl && (
              <GlassButton
                variant="secondary"
                fullWidth
                onPress={() => {
                  void Linking.openURL(selectedTopic.sourceUrl!).catch(() => {
                    Alert.alert('Could not open video', 'Check that YouTube is available on this device and try again.');
                  });
                }}
              >
                Open source video
              </GlassButton>
            )}
            <GlassButton variant="ghost" fullWidth onPress={() => setSelectedTopic(null)}>
              Close
            </GlassButton>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useActiveTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
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
    (result.formatAdaptations?.length ?? 0) > 0 ||
    result.suggestedAngles.length > 0;
}

function formatTrendMetadata(trends: {
  provider: string;
  source: string;
  fetchedAt: string | null;
  isStatic: boolean;
  metricsQuality: string;
  dataKind: string;
}): string {
  if (trends.metricsQuality === 'fixture' || trends.isStatic) return 'Sample fixture data · Not a live measurement';
  const retrieved = trends.fetchedAt
    ? `Retrieved ${new Date(trends.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Retrieval time unavailable';
  const quality = trends.metricsQuality === 'measured' ? 'Measured source metrics' : 'Estimated metrics';
  const dataKind = trends.dataKind === 'popular_content' ? 'Popular content; historical growth unavailable' : 'Historical trend data';
  return `${trends.source || trends.provider} · ${retrieved} · ${quality} · ${dataKind}`;
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
  notesInput: { minHeight: 58 },
  results: { gap: 16, marginTop: 6 },
  sourceLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, maxHeight: '88%', width: '100%' },
  modalCardContent: { padding: 22, gap: 14 },
  modalTitle: { fontSize: 23, fontWeight: '800', lineHeight: 29 },
  modalMeta: { fontSize: 13, lineHeight: 19, textTransform: 'capitalize' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  metric: { alignItems: 'center', gap: 3, minWidth: 80 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 12 },
  modalDescription: { fontSize: 14, lineHeight: 21 },
  modalHint: { fontSize: 12, lineHeight: 18 },
  breakdownLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownError: { gap: 8 },
  breakdown: { gap: 16 },
  errorCard: { gap: 12, borderColor: 'rgba(248,113,113,0.35)' },
  errorText: { fontSize: 14, lineHeight: 20 },
  emptyText: { fontSize: 14, lineHeight: 20 },
  evidenceCard: { gap: 7, paddingTop: 4 },
  evidenceTitle: { fontSize: 15, fontWeight: '700' },
  evidenceItem: { fontSize: 13, lineHeight: 19 },
});

function formatTopicSignal(growthPercent: number | null, quality: string): string {
  if (growthPercent === null) return 'Growth unavailable';
  if (quality === 'fixture') return `Sample fixture: ${growthPercent}%`;
  if (quality === 'measured') return `+${growthPercent}% growth`;
  if (quality === 'estimated') return 'Estimated trend signal';
  return 'Growth unavailable';
}

function formatMetric(value: number | null | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return 'Unavailable';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useCreateIdea } from '@/hooks/useIdeas';
import { notifySuccess, notifyError, tapLight } from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { useDraft } from '@/hooks/useDraft';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { detectTextContent, contentTypeLabel } from '@/services/CaptureDetectionService';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { useSyncStatus } from '@/hooks/useSyncStatus';

type CaptureMode = 'text' | 'camera' | 'voice';

export default function CaptureScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createIdea = useCreateIdea();

  const [mode, setMode] = useState<CaptureMode>('text');
  const [title, setTitle] = useState('');
  const [insight, setInsight] = useState('');
  const [notes, setNotes] = useState('');
  const [origin, setOrigin] = useState('');
  const [draftDismissed, setDraftDismissed] = useState(false);
  const draft = useDraft();
  const ai = useAIAssistant({ title, insight, notes });
  const { status, pendingCount } = useSyncStatus();
  const detection = origin.trim() ? detectTextContent(origin) : detectTextContent(title);
  const hasTypedContent = Boolean(title.trim() || insight.trim() || notes.trim() || origin.trim());

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        insight: insight.trim() || undefined,
        notes: notes.trim() || undefined,
        origin: origin.trim() || undefined,
      });
      await notifySuccess();
      setTitle('');
      setInsight('');
      setNotes('');
      setOrigin('');
      draft.clearDraft();
      router.push('/(tabs)/ideas');
    } catch (error) {
      await notifyError();
      if (error instanceof Error && /network|offline|fetch/i.test(error.message)) {
        Alert.alert(
          'Saved locally',
          'Your idea is queued and will synchronize when you reconnect.',
        );
      }
    }
  }, [title, insight, notes, origin, createIdea, router, draft]);

  useEffect(() => {
    if (draft.isReady && draft.hasDraft && !draftDismissed) {
      return;
    }
  }, [draft.isReady, draft.hasDraft, draftDismissed]);

  useEffect(() => {
    if (!draft.isReady || !draft.hasDraft || draftDismissed) return;
    if (title || insight || notes || origin) return;
    // The explicit card below gives the user control over restoring input.
  }, [draft.isReady, draft.hasDraft, draftDismissed, title, insight, notes, origin]);

  useEffect(() => {
    if (title.trim() || insight.trim() || notes.trim() || origin.trim()) {
      draft.saveDraft({ title, insight, notes, origin });
    }
  }, [draft.saveDraft, title, insight, notes, origin]);

  const restoreDraft = useCallback(() => {
    if (!draft.draft) return;
    setTitle(draft.draft.title);
    setInsight(draft.draft.insight);
    setNotes(draft.draft.notes);
    setOrigin(draft.draft.origin);
    setDraftDismissed(true);
  }, [draft.draft]);

  const applySuggestion = useCallback(
    (field: 'title' | 'hook' | 'description') => {
      const value = ai.suggestions[field];
      if (!value || typeof value !== 'string') return;
      if (field === 'title') setTitle(value);
      else if (field === 'hook') setInsight(value);
      else setNotes(value);
      ai.acceptSuggestion(field);
    },
    [ai],
  );

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
             { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 112 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.text }]}>Capture</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            Capture an idea before it disappears
          </Text>
          <View style={styles.statusRow}>
            <SyncStatusIndicator alwaysVisible />
            <Text style={[styles.localSave, { color: theme.textMuted }]}>
              Saved locally while you type
            </Text>
          </View>

          {draft.isReady && draft.hasDraft && !draftDismissed && !hasTypedContent && (
            <GlassCard style={styles.recoveryCard}>
              <Text style={[styles.recoveryTitle, { color: theme.text }]}>Recovered draft</Text>
              <Text style={[styles.recoveryText, { color: theme.textMuted }]}>
                An unfinished idea from a previous session is available.
              </Text>
              <View style={styles.recoveryActions}>
                <GlassButton size="sm" onPress={restoreDraft}>Restore</GlassButton>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    draft.clearDraft();
                    setDraftDismissed(true);
                  }}
                >
                  Discard
                </GlassButton>
              </View>
            </GlassCard>
          )}

          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(
              [
                 { key: 'text', label: 'Text' },
                 { key: 'camera', label: 'Camera' },
                 { key: 'voice', label: 'Voice' },
              ] as { key: CaptureMode; label: string }[]
            ).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={async () => {
                  await tapLight();
                  setMode(key);
                }}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor:
                      mode === key ? theme.accentSoft : theme.bgGlass,
                    borderColor: mode === key ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === key ? theme.accent : theme.textMuted },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'text' && (
            <GlassCard style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Title *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.bgGlassDeep,
                      borderColor: title ? theme.borderActive : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's the idea?"
                  placeholderTextColor={theme.textFaint}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoFocus
                />
                {detection.type !== 'plain_text' && detection.type !== 'unknown' && (
                  <View style={[styles.detection, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.detectionTitle, { color: theme.accent }]}>
                      {contentTypeLabel(detection.type)} detected
                    </Text>
                    <Text style={[styles.detectionText, { color: theme.textMuted }]}>
                      {detection.type === 'url'
                        ? 'Save this link as the idea source.'
                        : 'Save the link and add your own context below.'}
                    </Text>
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      onPress={() => setOrigin(title.trim())}
                    >
                      Use as source
                    </GlassButton>
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Insight
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.bgGlassDeep,
                      borderColor: insight ? theme.borderActive : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={insight}
                  onChangeText={setInsight}
                  placeholder="What's the hook or angle?"
                  placeholderTextColor={theme.textFaint}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {origin ? (
                <View style={styles.sourceRow}>
                  <Text style={[styles.sourceLabel, { color: theme.textMuted }]}>
                    Source: {origin}
                  </Text>
                  <TouchableOpacity onPress={() => setOrigin('')}>
                    <Text style={{ color: theme.accent }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {(ai.isLoading || ai.isError || Object.keys(ai.suggestions).length > 0) && (
                <View style={[styles.aiCard, { borderColor: theme.border }]}>
                  <View style={styles.aiHeader}>
                    <Text style={[styles.aiTitle, { color: theme.text }]}>AI suggestions</Text>
                    {!ai.isLoading && (
                      <TouchableOpacity onPress={ai.dismissSuggestions}>
                        <Text style={{ color: theme.textMuted }}>Dismiss</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {ai.isLoading && (
                    <Text style={[styles.aiText, { color: theme.textMuted }]}>
                      Thinking… you can keep typing.
                    </Text>
                  )}
                  {ai.isError && (
                    <Text style={[styles.aiText, { color: theme.error }]}>
                      Suggestions are unavailable right now. Your draft is safe.
                    </Text>
                  )}
                  {ai.suggestions.title && (
                    <SuggestionRow
                      label="Title"
                      value={ai.suggestions.title}
                      onApply={() => applySuggestion('title')}
                      theme={theme}
                    />
                  )}
                  {ai.suggestions.hook && (
                    <SuggestionRow
                      label="Hook"
                      value={ai.suggestions.hook}
                      onApply={() => applySuggestion('hook')}
                      theme={theme}
                    />
                  )}
                  {ai.suggestions.description && (
                    <SuggestionRow
                      label="Notes"
                      value={ai.suggestions.description}
                      onApply={() => applySuggestion('description')}
                      theme={theme}
                    />
                  )}
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Notes
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.bgGlassDeep,
                      borderColor: notes ? theme.borderActive : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any extra details…"
                  placeholderTextColor={theme.textFaint}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <GlassButton
                onPress={() => void handleSave()}
                loading={createIdea.isPending}
                disabled={!title.trim()}
                fullWidth
                size="lg"
              >
                Save Idea
              </GlassButton>
            </GlassCard>
          )}

          {mode === 'camera' && (
            <GlassCard style={styles.comingSoon}>
              <Text style={[styles.csIcon, { color: theme.accent }]}>▣</Text>
              <Text style={[styles.csTitle, { color: theme.text }]}>
                Camera Capture
              </Text>
              <Text style={[styles.csSub, { color: theme.textMuted }]}>
                Photo capture, mood boards, and OCR scanning are coming in
                Phase 3.
              </Text>
            </GlassCard>
          )}

          {mode === 'voice' && (
            <GlassCard style={styles.comingSoon}>
              <Text style={[styles.csIcon, { color: theme.accent }]}>◉</Text>
              <Text style={[styles.csTitle, { color: theme.text }]}>
                Voice Capture
              </Text>
              <Text style={[styles.csSub, { color: theme.textMuted }]}>
                One-tap voice recording with AI transcription is coming in
                Phase 3.
              </Text>
            </GlassCard>
          )}
          <Text style={[styles.syncMessage, { color: theme.textMuted }]}>
            {status === 'offline'
              ? 'Offline — changes are saved locally.'
              : status === 'syncing'
                ? 'Synchronizing your queued ideas…'
                : status === 'pending'
                  ? `${pendingCount} idea${pendingCount === 1 ? '' : 's'} queued for synchronization.`
                  : 'Synchronized'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 22 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 },
  sub: { fontSize: 15, marginTop: -12, lineHeight: 22 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 48,
  },
  modeText: { fontSize: 13, fontWeight: '600' },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 92,
    lineHeight: 21,
  },
  comingSoon: { alignItems: 'center', gap: 14, paddingVertical: 48 },
  csIcon: { fontSize: 42, lineHeight: 50 },
  csTitle: { fontSize: 21, fontWeight: '700' },
  csSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  localSave: { fontSize: 12 },
  recoveryCard: { gap: 10 },
  recoveryTitle: { fontSize: 17, fontWeight: '700' },
  recoveryText: { fontSize: 14, lineHeight: 20 },
  recoveryActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  detection: { borderRadius: 16, padding: 14, gap: 8, marginTop: 10 },
  detectionTitle: { fontSize: 14, fontWeight: '700' },
  detectionText: { fontSize: 12, lineHeight: 17 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  sourceLabel: { flex: 1, fontSize: 12 },
  aiCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiTitle: { fontSize: 14, fontWeight: '700' },
  aiText: { fontSize: 12, lineHeight: 17 },
  syncMessage: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

function SuggestionRow({
  label,
  value,
  onApply,
  theme,
}: {
  label: string;
  value: string;
  onApply: () => void;
  theme: ReturnType<typeof useActiveTheme>;
}) {
  return (
    <View style={suggestionStyles.row}>
      <View style={suggestionStyles.copy}>
        <Text style={[suggestionStyles.label, { color: theme.accent }]}>{label}</Text>
        <Text style={[suggestionStyles.value, { color: theme.text }]} numberOfLines={3}>
          {value}
        </Text>
      </View>
      <GlassButton size="sm" variant="secondary" onPress={onApply}>Apply</GlassButton>
    </View>
  );
}

const suggestionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 13, lineHeight: 18 },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useCreateIdea } from '@/hooks/useIdeas';
import { notifySuccess, notifyError, tapLight } from '@/lib/haptics';
import { useRouter } from 'expo-router';

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

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        insight: insight.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await notifySuccess();
      setTitle('');
      setInsight('');
      setNotes('');
      router.push('/(tabs)/ideas');
    } catch {
      await notifyError();
    }
  }, [title, insight, notes, createIdea, router]);

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.text }]}>Capture</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            Capture an idea before it disappears
          </Text>

          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(
              [
                { key: 'text', label: '✏️ Text' },
                { key: 'camera', label: '📷 Camera' },
                { key: 'voice', label: '🎙️ Voice' },
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
              <Text style={styles.csIcon}>📷</Text>
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
              <Text style={styles.csIcon}>🎙️</Text>
              <Text style={[styles.csTitle, { color: theme.text }]}>
                Voice Capture
              </Text>
              <Text style={[styles.csSub, { color: theme.textMuted }]}>
                One-tap voice recording with AI transcription is coming in
                Phase 3.
              </Text>
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  sub: { fontSize: 15, marginTop: -8 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeText: { fontSize: 13, fontWeight: '600' },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
  },
  comingSoon: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  csIcon: { fontSize: 48 },
  csTitle: { fontSize: 20, fontWeight: '700' },
  csSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

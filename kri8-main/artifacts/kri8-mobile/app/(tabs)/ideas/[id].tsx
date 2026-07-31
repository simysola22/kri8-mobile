import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useIdeaDetail, useDeleteIdea, useMarkIdeaUsed } from '@/hooks/useIdeas';
import { notifySuccess, tapHeavy } from '@/lib/haptics';

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = Number(id);
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: idea, isLoading } = useIdeaDetail(ideaId);
  const deleteIdea = useDeleteIdea();
  const markUsed = useMarkIdeaUsed();

  const handleDelete = () => {
    Alert.alert('Delete idea?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await tapHeavy();
          await deleteIdea.mutateAsync(ideaId);
          router.back();
        },
      },
    ]);
  };

  const handleMarkUsed = async () => {
    await markUsed.mutateAsync({ id: ideaId });
    await notifySuccess();
  };

  if (isLoading || !idea) return <LoadingSpinner fullScreen />;

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      {/* Back button */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
        </TouchableOpacity>
        {!idea.isUsed && (
          <TouchableOpacity onPress={() => void handleMarkUsed()}>
            <Text style={[styles.markUsed, { color: theme.textMuted }]}>
              Mark used
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + status */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>{idea.title}</Text>
          {idea.isUsed && <Badge variant="success">Used</Badge>}
          {idea.branchCount > 0 && (
            <Badge variant="muted">{idea.branchCount} branches</Badge>
          )}
        </View>

        {/* Fields */}
        {idea.insight && (
          <Field label="Insight" value={idea.insight} />
        )}
        {idea.origin && (
          <Field label="Origin" value={idea.origin} />
        )}
        {idea.notes && (
          <Field label="Notes" value={idea.notes} />
        )}
        {idea.videoEditingNotes && (
          <Field label="Video Notes" value={idea.videoEditingNotes} />
        )}

        {/* Branches */}
        {(idea.branches ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Branches
            </Text>
            {idea.branches.map((branch) => (
              <GlassCard key={branch.id} style={styles.branchCard}>
                <Text style={[styles.branchTitle, { color: theme.text }]}>
                  {branch.title}
                </Text>
                {branch.insight && (
                  <Text style={[styles.branchInsight, { color: theme.textMuted }]}>
                    {branch.insight}
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>
        )}

        {/* Actions */}
        <GlassButton
          onPress={handleDelete}
          variant="danger"
          fullWidth
          style={styles.deleteBtn}
          loading={deleteIdea.isPending}
        >
          Delete Idea
        </GlassButton>
      </ScrollView>
    </LinearGradient>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const theme = useActiveTheme();
  return (
    <GlassCard style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: theme.text }]}>{value}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 8 },
  backText: { fontSize: 17, fontWeight: '600' },
  markUsed: { fontSize: 14, fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  titleRow: { gap: 8, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  field: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  fieldValue: { fontSize: 15, lineHeight: 22 },
  branchCard: { gap: 4 },
  branchTitle: { fontSize: 15, fontWeight: '600' },
  branchInsight: { fontSize: 13 },
  deleteBtn: { marginTop: 8 },
});

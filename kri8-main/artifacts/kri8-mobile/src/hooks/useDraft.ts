/**
 * useDraft
 *
 * Automatic draft persistence for idea creation and editing.
 * Restores previous session content if the app was interrupted.
 *
 * Usage (new idea):
 *   const { draft, saveDraft, clearDraft, hasDraft } = useDraft();
 *
 * Usage (editing existing idea):
 *   const { draft, saveDraft, clearDraft, hasDraft } = useDraft(ideaId);
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import * as DraftService from '@/services/DraftService';
import { analytics } from '@/services/analytics/AnalyticsService';

type DraftFields = Partial<Omit<DraftService.IdeaDraft, 'ideaId' | 'savedAt'>>;

export interface UseDraftResult {
  /** The restored draft, or null if no draft exists. */
  draft: DraftService.IdeaDraft | null;
  /** True if a draft was recovered from a previous session. */
  hasDraft: boolean;
  /** Save current field values to the draft store (debounced internally). */
  saveDraft: (fields: DraftFields) => void;
  /** Clear the draft after a successful submit. */
  clearDraft: () => void;
  /** True after the persisted draft has been checked. */
  isReady: boolean;
}

const DEBOUNCE_MS = 500;

export function useDraft(ideaId?: number): UseDraftResult {
  const [draft, setDraft] = useState<DraftService.IdeaDraft | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    const recovered = ideaId
      ? DraftService.getEditIdeaDraft(ideaId)
      : DraftService.getNewIdeaDraft();

    if (recovered) {
      setDraft(recovered);
      setHasDraft(true);
      analytics.track('draft_recovered', {
        ideaId: ideaId ?? -1,
        ageMs: Date.now() - recovered.savedAt,
      });
    }
    setIsReady(true);
  }, [ideaId]);

  const saveDraft = useCallback(
    (fields: DraftFields) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (ideaId !== undefined) {
          DraftService.saveEditIdeaDraft(ideaId, fields);
        } else {
          DraftService.saveNewIdeaDraft(fields);
        }
      }, DEBOUNCE_MS);
    },
    [ideaId],
  );

  const clearDraft = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (ideaId !== undefined) {
      DraftService.clearEditIdeaDraft(ideaId);
    } else {
      DraftService.clearNewIdeaDraft();
    }
    setDraft(null);
    setHasDraft(false);
  }, [ideaId]);

  return { draft, hasDraft, saveDraft, clearDraft, isReady };
}

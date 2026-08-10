/**
 * DraftService
 *
 * Automatic draft persistence so users never lose work if the app crashes.
 * Backs up idea text, notes, AI prompts, and voice transcripts to MMKV.
 * Restored automatically when the relevant screen mounts.
 */
import { createStorage } from '@/lib/kv';

const storage = createStorage('kri8-drafts');

// ── Types ─────────────────────────────────────────────────────

export interface IdeaDraft {
  /** The idea being edited, or null for a new idea. */
  ideaId?: number;
  title: string;
  insight: string;
  notes: string;
  /** Source URL for smart capture, when present. */
  origin: string;
  /** Transcript from voice capture, if any. */
  voiceTranscript: string;
  /** Prompt the user typed in the AI panel. */
  aiPrompt: string;
  savedAt: number;
}

// ── Keys ──────────────────────────────────────────────────────

const NEW_IDEA_KEY = 'draft:new';

function editKey(id: number): string {
  return `draft:edit:${id}`;
}

// ── Save ──────────────────────────────────────────────────────

/** Persist a draft for a new idea. Call on every content change (debounce at call site). */
export function saveNewIdeaDraft(partial: Partial<Omit<IdeaDraft, 'ideaId' | 'savedAt'>>): void {
  const existing = getNewIdeaDraft() ?? emptyDraft();
  const draft: IdeaDraft = { ...existing, ...partial, savedAt: Date.now() };
  storage.set(NEW_IDEA_KEY, JSON.stringify(draft));
}

/** Persist a draft while editing an existing idea. */
export function saveEditIdeaDraft(
  ideaId: number,
  partial: Partial<Omit<IdeaDraft, 'ideaId' | 'savedAt'>>,
): void {
  const existing = getEditIdeaDraft(ideaId) ?? emptyDraft(ideaId);
  const draft: IdeaDraft = { ...existing, ...partial, savedAt: Date.now() };
  storage.set(editKey(ideaId), JSON.stringify(draft));
}

// ── Restore ───────────────────────────────────────────────────

/** Retrieve a persisted new-idea draft, or null if none. */
export function getNewIdeaDraft(): IdeaDraft | null {
  return parseDraft(storage.getString(NEW_IDEA_KEY));
}

/** Retrieve a persisted edit draft for an existing idea, or null if none. */
export function getEditIdeaDraft(ideaId: number): IdeaDraft | null {
  return parseDraft(storage.getString(editKey(ideaId)));
}

// ── Clear ─────────────────────────────────────────────────────

/** Clear the new-idea draft after successful submission. */
export function clearNewIdeaDraft(): void {
  storage.delete(NEW_IDEA_KEY);
}

/** Clear the edit draft after successful save. */
export function clearEditIdeaDraft(ideaId: number): void {
  storage.delete(editKey(ideaId));
}

// ── Helpers ───────────────────────────────────────────────────

function emptyDraft(ideaId?: number): IdeaDraft {
  return {
    ideaId,
    title: '',
    insight: '',
    notes: '',
    origin: '',
    voiceTranscript: '',
    aiPrompt: '',
    savedAt: Date.now(),
  };
}

function parseDraft(raw: string | undefined): IdeaDraft | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdeaDraft;
  } catch {
    return null;
  }
}

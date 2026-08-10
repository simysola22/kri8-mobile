/**
 * AIAssistantService
 *
 * Contextual AI assistance that works invisibly while the user types.
 * Does NOT create a separate AI page — suggestions feel automatic and in-context.
 *
 * Suggests:
 *  - Better titles
 *  - Hooks
 *  - Descriptions
 *  - Tags
 *  - Content categories
 *  - Posting platforms
 *  - Posting times
 *  - Alternative wording
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

// ── Types ─────────────────────────────────────────────────────

export interface AISuggestions {
  /** Improved title suggestion. */
  title?: string;
  /** Hook / attention-grabbing opening line. */
  hook?: string;
  /** Rewritten description for clarity. */
  description?: string;
  /** Suggested tags. */
  tags?: string[];
  /** Content category (e.g. "Educational", "Entertainment"). */
  category?: string;
  /** Recommended posting platforms (e.g. ["YouTube", "TikTok"]). */
  platforms?: string[];
  /** Recommended posting time (e.g. "Tuesday 6 PM"). */
  postingTime?: string;
  /** Alternative wording options. */
  alternatives?: string[];
}

export interface AssistantContext {
  title?: string;
  insight?: string;
  notes?: string;
  /** Which fields to generate suggestions for. Defaults to all. */
  focus?: Array<keyof AISuggestions>;
}

// ── API call ──────────────────────────────────────────────────

/**
 * Request AI suggestions for the current idea content.
 * Debounce calls at the hook layer — do not call on every keystroke here.
 */
export async function getAISuggestions(
  token: string,
  context: AssistantContext,
): Promise<AISuggestions> {
  // Skip if there's not enough content to work with
  const hasContent =
    (context.title?.trim().length ?? 0) > 3 ||
    (context.insight?.trim().length ?? 0) > 10;

  if (!hasContent) return {};

  try {
    const res = await fetch(`${API_BASE}/api/trends/inspire`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildPrompt(context),
        mode: 'assistant',
      }),
    });

    if (!res.ok) {
      throw new Error(`AI assistant request failed (${res.status})`);
    }

    const data = await res.json() as {
      suggestion?: string;
      tags?: string[];
      platforms?: string[];
    };

    return parseSuggestions(data, context);
  } catch (error) {
    throw error instanceof Error ? error : new Error('AI assistant request failed');
  }
}

// ── Trend analysis ────────────────────────────────────────────

export interface TrendAnalysis {
  trendScore: number;      // 0-100
  momentum: string;        // "rising" | "stable" | "declining"
  relatedTrends: string[];
  bestPlatforms: string[];
  suggestedTiming: string;
}

/**
 * Analyze an idea against current trends.
 */
export async function analyzeIdeaAgainstTrends(
  token: string,
  ideaTitle: string,
  ideaInsight: string,
): Promise<TrendAnalysis | null> {
  try {
    const res = await fetch(`${API_BASE}/api/trends/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: ideaTitle, insight: ideaInsight }),
    });

    if (!res.ok) return null;
    return res.json() as Promise<TrendAnalysis>;
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────

function buildPrompt(context: AssistantContext): string {
  const parts: string[] = [];
  if (context.title) parts.push(`Title: ${context.title}`);
  if (context.insight) parts.push(`Idea: ${context.insight}`);
  if (context.notes) parts.push(`Notes: ${context.notes}`);
  return parts.join('\n');
}

function parseSuggestions(
  data: { suggestion?: string; tags?: string[]; platforms?: string[] },
  context: AssistantContext,
): AISuggestions {
  const result: AISuggestions = {};

  if (data.suggestion) {
    // Try to extract title from the first line of suggestion
    const lines = data.suggestion.split('\n').filter(Boolean);
    if (lines[0] && lines[0] !== context.title) {
      result.title = lines[0];
    }
    if (lines[1]) {
      result.hook = lines[1];
    }
    if (lines.slice(2).length > 0) {
      result.description = lines.slice(2).join(' ');
    }
  }

  if (data.tags?.length) result.tags = data.tags;
  if (data.platforms?.length) result.platforms = data.platforms;

  return result;
}

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

async function getApiError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json() as { error?: unknown };
    if (typeof body.error === 'string' && body.error.trim()) {
      return new Error(body.error);
    }
  } catch {
    // Use the safe fallback for empty or non-JSON responses.
  }
  return new Error(fallback);
}

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
        title: context.title?.trim() ?? '',
        notes: buildPrompt(context),
      }),
    });

    if (!res.ok) {
      throw await getApiError(res, `AI assistant request failed (${res.status})`);
    }

    const data = await res.json() as InspirationResponse;

    return parseSuggestions(data, context);
  } catch (error) {
    throw error instanceof Error ? error : new Error('AI assistant request failed');
  }
}

// ── Trend analysis ────────────────────────────────────────────

export interface TrendAnalysis {
  relevanceScore: number;
  relatedTopics: Array<{
    id: string;
    name: string;
    category: string;
    growthPercent: number;
    volume: number;
    platform: string;
  }>;
  relatedHashtags: Array<{
    tag: string;
    platform: string;
    volume: number;
    growthPercent: number;
  }>;
  contentOpportunities: string[];
  suggestedAngles: string[];
}

/**
 * Analyze an idea against current trends.
 */
export async function analyzeIdeaAgainstTrends(
  token: string,
  ideaTitle: string,
  ideaInsight: string,
): Promise<TrendAnalysis> {
  const res = await fetch(`${API_BASE}/api/trends/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: ideaTitle.trim(), notes: ideaInsight.trim() }),
  });

  if (!res.ok) {
    throw await getApiError(res, `Trend analysis request failed (${res.status})`);
  }
  return res.json() as Promise<TrendAnalysis>;
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
  data: InspirationResponse,
  context: AssistantContext,
): AISuggestions {
  const result: AISuggestions = {};

  const suggestedTitle = data.titleSuggestions?.find(
    (suggestion) => suggestion.trim() && suggestion.trim() !== context.title?.trim(),
  );
  if (suggestedTitle) {
    result.title = suggestedTitle;
  }

  if (data.alternativeHooks?.[0]) {
    result.hook = data.alternativeHooks[0];
  }

  // The existing inspiration contract returns related ideas rather than
  // rewritten descriptions; expose the first related idea as an optional
  // notes suggestion without fabricating a new response shape.
  if (data.relatedIdeas?.[0]) {
    result.description = data.relatedIdeas[0];
  }

  return result;
}

/** Response shape returned by the existing POST /api/trends/inspire route. */
interface InspirationResponse {
  relatedIdeas?: string[];
  alternativeHooks?: string[];
  titleSuggestions?: string[];
  audienceQuestions?: string[];
  source?: 'openai' | 'template';
}

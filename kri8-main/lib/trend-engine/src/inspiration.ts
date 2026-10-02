/**
 * Creator Inspiration Engine
 *
 * Uses OpenAI for generation and fails explicitly when it is unavailable.
 */
import type { KeywordTrend, InspirationResult } from "./types.js";
import {
  inspirationContentSchema,
  inspirationResultSchema,
  parseAIResponse,
} from "./ai-contracts.js";
import { requestOpenAIJson } from "./openai.js";

function normalizeCanonicalQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

async function generateWithOpenAI(
  title: string,
  notes: string,
  trendKeywords: string[],
): Promise<Omit<InspirationResult, "source" | "canonicalQuery">> {
  const prompt = `You are a content strategy expert helping a creator turn an idea into a practical content plan.
Canonical query: "${title}"
Notes: "${notes || "none"}"
Trending context: ${trendKeywords.slice(0, 5).join(", ")}

Use the complete canonical query as the primary subject. Preserve every multi-word
concept as one meaningful semantic unit. Never reduce a phrase to one of its
individual words or substitute a related-looking word. For example, "house
hunting" is about the activity of searching for a home, not generic houses,
housework, home decoration, or architecture. Infer the real-world meaning,
audience intent, creator goal,
platform fit, and differentiated angles from the title and notes.
Make suggestions specific, practical, and creator-ready rather than generic
keyword commentary. Do not merely insert one keyword into a generic template.
Every suggestion must remain clearly useful for the canonical query.
Do not provide chain-of-thought, hidden reasoning, or analysis; return only the
requested JSON object.

Return a JSON object with exactly these keys:
- relatedIdeas: array of 10 unique video/content ideas
- alternativeHooks: array of 5 compelling opening hooks (first lines that grab attention)
- titleSuggestions: array of 5 SEO-optimized video title options
- audienceQuestions: array of 5 engaging questions to ask the audience

Keep everything short, punchy, and creator-focused. No markdown, pure JSON.`;

  return parseAIResponse(inspirationContentSchema, await requestOpenAIJson(prompt, 0.8));
}

export async function generateInspiration(
  title: string,
  notes: string,
  trends: KeywordTrend[],
): Promise<InspirationResult> {
  const trendKeywords = trends.flatMap(t => [t.keyword, ...t.relatedTopics.map(rt => rt.name)]);
  const canonicalQuery = normalizeCanonicalQuery(title);

  const aiResult = await generateWithOpenAI(canonicalQuery, notes, trendKeywords);
  return parseAIResponse(inspirationResultSchema, {
    ...aiResult,
    canonicalQuery,
    source: "openai",
  });
}

/**
 * Creator Inspiration Engine
 *
 * Uses OpenAI for generation and fails explicitly when it is unavailable.
 */
import type { KeywordTrend, InspirationResult } from "./types.js";

function normalizeCanonicalQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function cleanStringArray(value: unknown, field: string): string[] {
  if (!isStringArray(value)) {
    throw new Error(`AI provider returned invalid ${field}`);
  }
  const cleaned = [...new Set(value.map(item => item.trim()).filter(Boolean))];
  if (cleaned.length < 3) {
    throw new Error(`AI provider returned too few ${field}`);
  }
  return cleaned;
}

function parseInspirationResponse(
  value: unknown,
): Omit<InspirationResult, "source" | "canonicalQuery"> {
  if (!value || typeof value !== "object") {
    throw new Error("AI provider returned an invalid response");
  }

  const result = value as Record<string, unknown>;
  return {
    relatedIdeas: cleanStringArray(result.relatedIdeas, "relatedIdeas"),
    alternativeHooks: cleanStringArray(result.alternativeHooks, "alternativeHooks"),
    titleSuggestions: cleanStringArray(result.titleSuggestions, "titleSuggestions"),
    audienceQuestions: cleanStringArray(result.audienceQuestions, "audienceQuestions"),
  };
}

async function generateWithOpenAI(
  title: string,
  notes: string,
  trendKeywords: string[],
): Promise<Omit<InspirationResult, "source" | "canonicalQuery">> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
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

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI provider request failed (${res.status})`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    const parsed = parseInspirationResponse(JSON.parse(content));
    if (
      parsed.relatedIdeas.length === 0 ||
      parsed.alternativeHooks.length === 0 ||
      parsed.titleSuggestions.length === 0 ||
      parsed.audienceQuestions.length === 0
    ) {
      throw new Error("AI provider returned incomplete inspiration");
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI provider timed out");
    }
    throw error instanceof Error ? error : new Error("AI provider request failed");
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateInspiration(
  title: string,
  notes: string,
  trends: KeywordTrend[],
): Promise<InspirationResult> {
  const trendKeywords = trends.flatMap(t => [t.keyword, ...t.relatedTopics.map(rt => rt.name)]);
  const canonicalQuery = normalizeCanonicalQuery(title);

  const aiResult = await generateWithOpenAI(title, notes, trendKeywords);
  return { ...aiResult, canonicalQuery, source: "openai" };
}

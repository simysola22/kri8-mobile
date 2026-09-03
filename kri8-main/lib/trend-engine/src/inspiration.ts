/**
 * Creator Inspiration Engine
 *
 * Template-based by default. Set OPENAI_API_KEY to upgrade to AI-powered
 * generation (uses the official OpenAI API — not Replit-specific).
 *
 * To add custom AI providers, implement the AIProvider interface.
 */
import { extractKeywords } from "./analyzer.js";
import type { KeywordTrend, InspirationResult } from "./types.js";

const HOOK_TEMPLATES = [
  "Why most creators get {topic} completely wrong (and what actually works)",
  "I tried {topic} for 30 days — here's exactly what happened",
  "The {topic} strategy that 10x'd my channel in 60 days",
  "Nobody is talking about this {topic} method (but they should be)",
  "How I went from 0 to results with {topic} — full breakdown",
  "The honest truth about {topic} that gurus won't tell you",
  "Stop doing {topic} this way — do this instead",
  "I interviewed 100 creators about {topic} — here's what I learned",
];

const TITLE_PATTERNS = [
  "{topic}: The Complete 2025 Guide",
  "How to Master {topic} (Step-by-Step)",
  "{topic} for Beginners — Everything You Need to Know",
  "The REAL Way to Use {topic} as a Creator",
  "I Tested Every {topic} Method — Here Are the Results",
];

const AUDIENCE_QUESTION_TEMPLATES = [
  "What's the biggest challenge you face with {topic}?",
  "Have you tried {topic} yet? What stopped you?",
  "Which part of {topic} confuses you the most?",
  "Would you pay for a course on {topic}? Why or why not?",
  "What result would make {topic} worth your time?",
];

const IDEA_TEMPLATES = [
  "Behind-the-scenes: how I built my {topic} process from scratch",
  "{topic} case study — what I wish I knew when I started",
  "Tools I use for {topic} (and why I switched from the popular ones)",
  "The {topic} mistake that cost me 3 months of progress",
  "Comparing the top 5 {topic} strategies — which one actually wins?",
  "How to automate your {topic} workflow in 2025",
  "Day-in-the-life: what {topic} really looks like for a solo creator",
  "Collaborating on {topic} — what I learned from working with other creators",
  "The psychology of {topic} — why it works better than you think",
  "{topic} myths vs. reality — I tested them all",
];

function fill(template: string, keyword: string): string {
  return template.replace(/{topic}/g, keyword).replace(/{outcome}/g, "10x results");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function parseInspirationResponse(value: unknown): InspirationResult {
  if (!value || typeof value !== "object") {
    throw new Error("AI provider returned an invalid response");
  }

  const result = value as Record<string, unknown>;
  const fields = ["relatedIdeas", "alternativeHooks", "titleSuggestions", "audienceQuestions"];
  if (!fields.every(field => isStringArray(result[field]))) {
    throw new Error("AI provider returned an invalid response shape");
  }

  return {
    relatedIdeas: result.relatedIdeas as string[],
    alternativeHooks: result.alternativeHooks as string[],
    titleSuggestions: result.titleSuggestions as string[],
    audienceQuestions: result.audienceQuestions as string[],
  };
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function generateWithOpenAI(
  title: string,
  notes: string,
  trendKeywords: string[],
): Promise<InspirationResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `You are a content strategy expert helping a creator brainstorm.
Idea title: "${title}"
Notes: "${notes || "none"}"
Trending context: ${trendKeywords.slice(0, 5).join(", ")}

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

    return parseInspirationResponse(JSON.parse(content));
  } catch (error) {
    throw error instanceof Error ? error : new Error("AI provider request failed");
  }
}

export async function generateInspiration(
  title: string,
  notes: string,
  trends: KeywordTrend[],
): Promise<InspirationResult> {
  const trendKeywords = trends.flatMap(t => [t.keyword, ...t.relatedTopics.map(rt => rt.name)]);
  const primaryKeywords = extractKeywords(`${title} ${notes}`);
  const keyword = primaryKeywords.slice(0, 6).join(" ") || title.trim() || "content";

  const aiResult = await generateWithOpenAI(title, notes, trendKeywords);
  if (aiResult) return aiResult;

  const relatedIdeas = pickN(IDEA_TEMPLATES, 10).map(t => fill(t, keyword));
  const alternativeHooks = pickN(HOOK_TEMPLATES, 5).map(t => fill(t, keyword));
  const titleSuggestions = TITLE_PATTERNS.map(t => fill(t, keyword));
  const audienceQuestions = pickN(AUDIENCE_QUESTION_TEMPLATES, 5).map(t => fill(t, keyword));

  return { relatedIdeas, alternativeHooks, titleSuggestions, audienceQuestions };
}

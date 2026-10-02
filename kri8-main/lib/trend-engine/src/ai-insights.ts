export interface IdeaCreatorInsight {
  audienceFit: string;
  differentiation: string;
  recommendedHook: string;
  risks: string[];
}

export interface TrendCreatorBreakdown {
  openingHook: string;
  structure: string[];
  whyItMayWork: string[];
  adaptationAngle: string;
  evidenceNote: string;
}

async function requestJson(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        temperature: 0.4,
      }),
    });
    if (!response.ok) throw new Error(`AI provider request failed (${response.status})`);
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response");
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("AI provider returned an invalid response");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("AI provider timed out");
    throw error instanceof Error ? error : new Error("AI provider request failed");
  } finally {
    clearTimeout(timeout);
  }
}

function requiredText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`AI provider returned invalid ${key}`);
  }
  return value.trim();
}

function requiredTextArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) {
    throw new Error(`AI provider returned invalid ${key}`);
  }
  const unique = [...new Set(value.map((item: string) => item.trim()))];
  if (unique.length === 0) throw new Error(`AI provider returned empty ${key}`);
  return unique;
}

export async function analyzeIdeaForCreator(
  title: string,
  notes: string,
  trendContext: string[],
): Promise<IdeaCreatorInsight> {
  const result = await requestJson(`You are a rigorous content strategist. Analyze this creator's idea without claiming unsupported facts.
Idea title: "${title}"
Creator context: "${notes || "not provided"}"
Related trend/source evidence: ${trendContext.length ? trendContext.join(" | ") : "none available"}

Treat the full title as one semantic concept, including every word in multi-word phrases. Give practical, specific advice. If evidence is absent, say so instead of inventing it.
Return only JSON with string fields audienceFit, differentiation, recommendedHook and risks as an array of 2-4 concise strings. No markdown or chain-of-thought.`);
  return {
    audienceFit: requiredText(result, "audienceFit"),
    differentiation: requiredText(result, "differentiation"),
    recommendedHook: requiredText(result, "recommendedHook"),
    risks: requiredTextArray(result, "risks"),
  };
}

export async function analyzeTrendContent(input: {
  title: string;
  description: string;
  platform: string;
  views?: number;
  likes?: number;
  comments?: number;
}): Promise<TrendCreatorBreakdown> {
  const result = await requestJson(`You are a video format analyst. Explain what can reasonably be inferred from one public video. Do not claim causality from popularity metrics and do not invent scenes, retention, or audience demographics.
Video title: "${input.title}"
Description: "${input.description || "not provided"}"
Platform: ${input.platform}
Public metrics: ${JSON.stringify({
    views: input.views ?? null,
    likes: input.likes ?? null,
    comments: input.comments ?? null,
  })}

Keep observations about the video distinct from hypotheses. An opening hook can only be inferred from the title/description if the transcript is unavailable. Return JSON with openingHook (string), structure (array of 3-6 short steps, explicitly label inferred steps), whyItMayWork (array of 2-4 cautious observations), adaptationAngle (string), evidenceNote (string that states this is a single-video inference based on available title/description and public counts). No markdown or chain-of-thought.`);
  return {
    openingHook: requiredText(result, "openingHook"),
    structure: requiredTextArray(result, "structure"),
    whyItMayWork: requiredTextArray(result, "whyItMayWork"),
    adaptationAngle: requiredText(result, "adaptationAngle"),
    evidenceNote: requiredText(result, "evidenceNote"),
  };
}
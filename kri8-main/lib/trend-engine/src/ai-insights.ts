import { z } from "zod";
import {
  creatorInsightSchema,
  parseAIResponse,
  trendCreatorBreakdownSchema,
} from "./ai-contracts.js";
import { requestOpenAIJson } from "./openai.js";

export type IdeaCreatorInsight = z.infer<typeof creatorInsightSchema>;
export type TrendCreatorBreakdown = z.infer<typeof trendCreatorBreakdownSchema>;

export async function analyzeIdeaForCreator(
  title: string,
  notes: string,
  trendContext: string[],
): Promise<IdeaCreatorInsight> {
  const result = await requestOpenAIJson(`You are a rigorous content strategist. Analyze this creator's idea without claiming unsupported facts.
Idea title: "${title}"
Creator context: "${notes || "not provided"}"
Related trend/source evidence: ${trendContext.length ? trendContext.join(" | ") : "none available"}

Treat the full title as one semantic concept, including every word in multi-word phrases. Give practical, specific advice. If evidence is absent, say so instead of inventing it.
Return only JSON with string fields audienceFit, differentiation, recommendedHook and risks as an array of 2-4 concise strings. No markdown or chain-of-thought.`, 0.4);
  return parseAIResponse(creatorInsightSchema, result);
}

export async function analyzeTrendContent(input: {
  title: string;
  description: string;
  platform: string;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
}): Promise<TrendCreatorBreakdown> {
  const result = await requestOpenAIJson(`You are a video format analyst. Explain what can reasonably be inferred from one public video. Do not claim causality from popularity metrics and do not invent scenes, retention, or audience demographics.
Video title: "${input.title}"
Description: "${input.description || "not provided"}"
Platform: ${input.platform}
Public metrics: ${JSON.stringify({
    views: input.views ?? null,
    likes: input.likes ?? null,
    comments: input.comments ?? null,
  })}

Keep observations about the video distinct from hypotheses. An opening hook can only be inferred from the title/description if the transcript is unavailable. Return JSON with openingHook (string), structure (array of 3-6 short steps, explicitly label inferred steps), whyItMayWork (array of 2-4 cautious observations), adaptationAngle (string), evidenceNote (string that states this is a single-video inference based on available title/description and public counts). No markdown or chain-of-thought.`, 0.4);
  return parseAIResponse(trendCreatorBreakdownSchema, result);
}
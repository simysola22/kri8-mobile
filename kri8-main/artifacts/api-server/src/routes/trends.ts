import { Router, type RequestHandler } from "express";
import { z } from "zod";
import {
  createTrendProvider,
  analyzeIdea,
  analyzeIdeaForCreator,
  analyzeTrendContent,
  generateInspiration,
  AIProviderError,
  type TrendProvider,
  type KeywordTrend,
} from "@workspace/trend-engine";
import { requireAuth } from "./users";
import { aiLimiter } from "../middlewares/rateLimit";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ideaRequestSchema = z.object({
  title: z.string().trim().min(1).max(240),
  notes: z.string().trim().max(2000).optional().default(""),
}).strict();
const trendDetailSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4000).optional().default(""),
  platform: z.string().trim().min(1).max(40),
  views: z.number().finite().min(0).nullable().optional(),
  likes: z.number().finite().min(0).nullable().optional(),
  comments: z.number().finite().min(0).nullable().optional(),
}).strict();

interface TrendsRouterDependencies {
  authenticate?: RequestHandler;
  aiRateLimit?: RequestHandler;
  createProvider?: typeof createTrendProvider;
  analyzeIdea?: typeof analyzeIdea;
  analyzeIdeaForCreator?: typeof analyzeIdeaForCreator;
  analyzeTrendContent?: typeof analyzeTrendContent;
  generateInspiration?: typeof generateInspiration;
}

function isConfigurationError(error: unknown): boolean {
  return error instanceof Error && /TREND_PROVIDER|YOUTUBE_API_KEY|OPENAI_API_KEY|Unsupported TREND_PROVIDER/.test(error.message);
}

function aiFailure(error: unknown, operation: string): {
  status: number;
  code: string;
  error: string;
} {
  if (error instanceof AIProviderError) {
    switch (error.category) {
      case "configuration":
        return { status: 503, code: "AI_NOT_CONFIGURED", error: `${operation} is not configured on the server` };
      case "malformed_output":
        return { status: 502, code: "AI_INVALID_RESPONSE", error: `${operation} returned an invalid response` };
      case "timeout":
        return { status: 504, code: "AI_TIMEOUT", error: `${operation} timed out` };
      case "quota_exhausted":
        return { status: 429, code: "AI_QUOTA_EXHAUSTED", error: `${operation} quota is exhausted` };
      case "rate_limited":
        return { status: 429, code: "AI_PROVIDER_RATE_LIMITED", error: `${operation} provider is rate limited` };
      case "provider_auth":
        return { status: 502, code: "AI_PROVIDER_AUTH", error: `${operation} provider authentication failed` };
      case "provider_failure":
        return { status: 502, code: "AI_PROVIDER_FAILURE", error: `${operation} provider failed` };
    }
  }
  if (isConfigurationError(error)) {
    return { status: 503, code: "TREND_PROVIDER_NOT_CONFIGURED", error: "Trend provider is not configured" };
  }
  return { status: 502, code: "AI_PROVIDER_FAILURE", error: `${operation} is temporarily unavailable` };
}

export function createTrendsRouter(dependencies: TrendsRouterDependencies = {}) {
const router = Router();
const authenticate = dependencies.authenticate ?? requireAuth;
const limitAI = dependencies.aiRateLimit ?? aiLimiter;
const getProvider = dependencies.createProvider ?? createTrendProvider;
const analyze = dependencies.analyzeIdea ?? analyzeIdea;
const analyzeForCreator = dependencies.analyzeIdeaForCreator ?? analyzeIdeaForCreator;
const analyzeContent = dependencies.analyzeTrendContent ?? analyzeTrendContent;
const inspire = dependencies.generateInspiration ?? generateInspiration;
let dashboardCache: { data: unknown; expiresAt: number } | null = null;
// GET /api/trends/dashboard
router.get("/dashboard", authenticate, async (req: any, res): Promise<void> => {
  try {
    if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
      res.json(dashboardCache.data);
      return;
    }

    const provider = getProvider();
    const dashboard = await provider.getDashboard();
    dashboardCache = { data: dashboard, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(dashboard);
  } catch (err) {
    req.log.error({ err }, "Failed to get trend dashboard");
    res.status(isConfigurationError(err) ? 503 : 502).json({
      error: isConfigurationError(err) ? "Trend provider is not configured" : "Trend provider request failed",
    });
  }
});

// POST /api/trends/analyze
router.post("/analyze", authenticate, limitAI, async (req: any, res): Promise<void> => {
  try {
    const input = ideaRequestSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: "Invalid idea analysis request", code: "INVALID_INPUT" });
      return;
    }
    const { title, notes } = input.data;

    const provider = getProvider();
    const dashboard = await provider.getDashboard();
    const trendAnalysis = analyze(title, notes, dashboard);
    const creatorInsight = await analyzeForCreator(
      title,
      notes,
      [
        ...trendAnalysis.relatedTopics.map((topic) => topic.name),
        ...trendAnalysis.relatedHashtags.map((hashtag) => hashtag.tag),
      ],
    );
    const result = { ...trendAnalysis, ...creatorInsight };
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze idea");
    const failure = aiFailure(err, "AI analysis");
    res.status(failure.status).json({ error: failure.error, code: failure.code });
  }
});

// POST /api/trends/inspire
router.post("/inspire", authenticate, limitAI, async (req: any, res): Promise<void> => {
  try {
    const input = ideaRequestSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: "Invalid inspiration request", code: "INVALID_INPUT" });
      return;
    }
    const { title, notes } = input.data;

    const canonicalQuery = title.replace(/\s+/g, " ");
    let keywordTrends: KeywordTrend[] = [];
    let trendContextAvailable = true;
    try {
      const provider = getProvider();
      keywordTrends = await provider.getKeywordTrends([canonicalQuery]);
    } catch (trendError) {
      trendContextAvailable = false;
      req.log.warn({ err: trendError }, "Trend context unavailable for AI inspiration");
    }
    const result = await inspire(canonicalQuery, notes, keywordTrends);
    res.json({ ...result, trendContextAvailable });
  } catch (err) {
    req.log.error({ err }, "Failed to generate inspiration");
    const failure = aiFailure(err, "AI inspiration");
    res.status(failure.status).json({ error: failure.error, code: failure.code });
  }
});

// POST /api/trends/detail — AI-derived breakdown of a single source video.
router.post("/detail", authenticate, limitAI, async (req: any, res): Promise<void> => {
  try {
    const input = trendDetailSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: "Invalid trend detail request", code: "INVALID_INPUT" });
      return;
    }
    const result = await analyzeContent(input.data);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze trend content");
    const failure = aiFailure(err, "AI trend analysis");
    res.status(failure.status).json({ error: failure.error, code: failure.code });
  }
});

return router;
}

const router = createTrendsRouter();
export default router;

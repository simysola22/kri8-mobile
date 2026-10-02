import { Router } from "express";
import {
  createTrendProvider,
  analyzeIdea,
  analyzeIdeaForCreator,
  analyzeTrendContent,
  generateInspiration,
  type KeywordTrend,
} from "@workspace/trend-engine";
import { requireAuth } from "./users";

const router = Router();

let dashboardCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isConfigurationError(error: unknown): boolean {
  return error instanceof Error && /TREND_PROVIDER|YOUTUBE_API_KEY|OPENAI_API_KEY|Unsupported TREND_PROVIDER/.test(error.message);
}

function failureStatus(error: unknown): number {
  return isConfigurationError(error) ? 503 : 502;
}

// GET /api/trends/dashboard
router.get("/dashboard", requireAuth, async (req: any, res): Promise<void> => {
  try {
    if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
      res.json(dashboardCache.data);
      return;
    }

    const provider = createTrendProvider();
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
router.post("/analyze", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    if (title.length > 240) { res.status(400).json({ error: "title must be 240 characters or fewer" }); return; }
    if (notes.length > 2000) { res.status(400).json({ error: "notes must be 2000 characters or fewer" }); return; }

    const provider = createTrendProvider();
    const dashboard = await provider.getDashboard();
    const trendAnalysis = analyzeIdea(title, notes, dashboard);
    const creatorInsight = await analyzeIdeaForCreator(
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
    res.status(failureStatus(err)).json({
      error: isConfigurationError(err)
        ? "AI analysis is not configured on the server"
        : "AI analysis is temporarily unavailable. Please try again.",
    });
  }
});

// POST /api/trends/inspire
router.post("/inspire", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    if (title.length > 240) { res.status(400).json({ error: "title must be 240 characters or fewer" }); return; }
    if (notes.length > 2000) { res.status(400).json({ error: "notes must be 2000 characters or fewer" }); return; }

    const canonicalQuery = title.replace(/\s+/g, " ");
    let keywordTrends: KeywordTrend[] = [];
    let trendContextAvailable = true;
    try {
      const provider = createTrendProvider();
      keywordTrends = await provider.getKeywordTrends([canonicalQuery]);
    } catch (trendError) {
      trendContextAvailable = false;
      req.log.warn({ err: trendError }, "Trend context unavailable for AI inspiration");
    }
    const result = await generateInspiration(canonicalQuery, notes, keywordTrends);
    res.json({ ...result, trendContextAvailable });
  } catch (err) {
    req.log.error({ err }, "Failed to generate inspiration");
    res.status(failureStatus(err)).json({
      error: isConfigurationError(err)
        ? "AI inspiration is not configured on the server"
        : "AI inspiration is temporarily unavailable. Please try again.",
    });
  }
});

// POST /api/trends/detail — AI-derived breakdown of a single source video.
router.post("/detail", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const platform = typeof req.body?.platform === "string" ? req.body.platform.trim() : "";
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    if (title.length > 240) { res.status(400).json({ error: "title must be 240 characters or fewer" }); return; }
    if (description.length > 4000) { res.status(400).json({ error: "description must be 4000 characters or fewer" }); return; }
    if (!platform || platform.length > 40) { res.status(400).json({ error: "platform is required" }); return; }
    const toMetric = (value: unknown): number | undefined =>
      typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
    const result = await analyzeTrendContent({
      title,
      description,
      platform,
      views: toMetric(req.body?.views),
      likes: toMetric(req.body?.likes),
      comments: toMetric(req.body?.comments),
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze trend content");
    res.status(failureStatus(err)).json({
      error: isConfigurationError(err)
        ? "AI trend analysis is not configured on the server"
        : "Trend analysis is temporarily unavailable. Please try again.",
    });
  }
});

export default router;

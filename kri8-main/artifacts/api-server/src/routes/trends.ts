import { Router } from "express";
import { createTrendProvider, analyzeIdea, generateInspiration } from "@workspace/trend-engine";
import { requireAuth } from "./users";

const router = Router();

let dashboardCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isConfigurationError(error: unknown): boolean {
  return error instanceof Error && /TREND_PROVIDER|YOUTUBE_API_KEY|Unsupported TREND_PROVIDER/.test(error.message);
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
    const result = analyzeIdea(title, notes, dashboard);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze idea");
    res.status(502).json({ error: "Trend analysis failed" });
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

    const provider = createTrendProvider();
    const keywordTrends = await provider.getKeywordTrends([title]);
    const result = await generateInspiration(title, notes, keywordTrends);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate inspiration");
    res.status(502).json({ error: "Inspiration generation failed" });
  }
});

export default router;

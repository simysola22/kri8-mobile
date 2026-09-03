import { Router } from "express";
import { createTrendProvider, analyzeIdea, generateInspiration } from "@workspace/trend-engine";
import { requireAuth } from "./users";

const router = Router();

let dashboardCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Trend provider request failed";
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
    const message = safeErrorMessage(err);
    const status = message.includes("TREND_PROVIDER") || message.includes("YOUTUBE_API_KEY") || message.includes("Unsupported TREND_PROVIDER")
      ? 503
      : 502;
    res.status(status).json({ error: message });
  }
});

// POST /api/trends/analyze
router.post("/analyze", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const provider = createTrendProvider();
    const dashboard = await provider.getDashboard();
    const result = analyzeIdea(title, notes, dashboard);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze idea");
    res.status(502).json({ error: safeErrorMessage(err) });
  }
});

// POST /api/trends/inspire
router.post("/inspire", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const provider = createTrendProvider();
    const keywordTrends = await provider.getKeywordTrends([title]);
    const result = await generateInspiration(title, notes, keywordTrends);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate inspiration");
    res.status(502).json({ error: safeErrorMessage(err) });
  }
});

export default router;

/**
 * Trend Engine — Provider Factory
 *
 * Set TREND_PROVIDER env var to switch data sources:
 *   TREND_PROVIDER=mock    — built-in fixture data (development/tests only)
 *   TREND_PROVIDER=youtube — YouTube Data API v3 (requires YOUTUBE_API_KEY)
 *
 * Future providers to plug in here:
 *   - tiktok: TikTok for Developers API (official)
 *   - instagram: Meta Content Publishing API
 *   - twitter: Twitter API v2 (X Developer Portal)
 */
import { MockTrendProvider } from "./providers/mock.js";
import { YouTubeTrendProvider } from "./providers/youtube.js";
import type { TrendProvider } from "./types.js";

export * from "./types.js";
export * from "./analyzer.js";
export * from "./inspiration.js";
export { MockTrendProvider } from "./providers/mock.js";
export { YouTubeTrendProvider } from "./providers/youtube.js";

let _provider: TrendProvider | null = null;

export function createTrendProvider(): TrendProvider {
  if (_provider) return _provider;

  const configuredName = process.env.TREND_PROVIDER?.trim().toLowerCase();
  const name = configuredName ?? (process.env.NODE_ENV === "development" ? "mock" : null);

  if (!name) {
    throw new Error("TREND_PROVIDER must be set outside development (youtube or mock)");
  }

  if (name === "youtube") {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("TREND_PROVIDER=youtube requires YOUTUBE_API_KEY");
    }
    _provider = new YouTubeTrendProvider(apiKey);
  } else if (name === "mock") {
    _provider = new MockTrendProvider();
  } else {
    throw new Error(`Unsupported TREND_PROVIDER "${name}". Expected "youtube" or "mock"`);
  }

  return _provider;
}

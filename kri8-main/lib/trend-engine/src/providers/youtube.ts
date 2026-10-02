/**
 * YouTube Data API v3 Trend Provider
 *
 * Plug-in ready for official YouTube Data API v3.
 * Set YOUTUBE_API_KEY to activate.
 *
 * API docs: https://developers.google.com/youtube/v3/docs
 * Terms: https://developers.google.com/youtube/terms/api-services-terms-of-service
 *
 * Required OAuth scopes (read-only): none — uses API key for public data
 * Rate limits: 10,000 units/day free tier
 */
import type {
  TrendDashboard,
  TrendingTopic,
  TrendingHashtag,
  KeywordTrend,
  TrendProvider,
  TrendSnapshot,
} from "../types.js";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeTrendProvider implements TrendProvider {
  readonly name = "youtube";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDashboard(): Promise<TrendDashboard> {
    const trending = await this.fetchTrendingVideos();
    const fetchedAt = new Date().toISOString();

    const topics = this.extractTopics(trending);
    const snapshots: TrendSnapshot[] = trending.flatMap((video, index) => {
      const id = getVideoId(video);
      const topic = video.snippet?.title?.trim();
      if (!id || !topic) return [];
      return [{
        topic,
        platform: "youtube",
        capturedAt: fetchedAt,
        views: parseNonnegativeCount(video.statistics?.viewCount),
        likes: parseNonnegativeCount(video.statistics?.likeCount),
        comments: parseNonnegativeCount(video.statistics?.commentCount),
        rank: index + 1,
      }];
    });

    return {
      topics,
      // YouTube snippet.tags are keywords, not measured hashtag usage or volume.
      hashtags: [],
      // This API response contains popular videos, not category growth history.
      categories: [],
      provider: this.name,
      source: this.name,
      fetchedAt,
      isStatic: false,
      metricsQuality: "measured",
      dataKind: "popular_content",
      snapshots,
    };
  }

  async getKeywordTrends(keywords: string[]): Promise<KeywordTrend[]> {
    return Promise.all(
      keywords.map(async (keyword) => {
        const results = await this.searchVideos(keyword);
        const topics = this.extractTopics(results);
        return {
          keyword,
          // Search results are ranked by views, but do not provide historical growth or query volume.
          trendScore: null,
          relatedTopics: topics.slice(0, 3),
          relatedHashtags: [],
        };
      })
    );
  }

  private async fetchTrendingVideos(): Promise<YouTubeVideo[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("videoCategoryId", "22"); // People & Blogs
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", this.apiKey);

    const data = await this.fetchJson<{ items?: YouTubeVideo[] }>(url);
    return data.items ?? [];
  }

  private async searchVideos(query: string): Promise<YouTubeVideo[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("key", this.apiKey);

    const data = await this.fetchJson<{ items?: YouTubeVideo[] }>(url);
    return data.items ?? [];
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error(`YouTube provider request failed (${response.status})`);
      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("YouTube provider request failed")) {
        throw error;
      }
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw new Error("YouTube provider timed out");
      }
      throw new Error("YouTube provider request failed");
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractTopics(videos: YouTubeVideo[]): TrendingTopic[] {
    return videos.flatMap((video) => {
      const id = getVideoId(video);
      const name = video.snippet?.title?.trim();
      if (!id || !name) return [];
      return [{
        id,
        name,
        category: "People & Blogs",
        growthPercent: null,
        volume: parseNonnegativeCount(video.statistics?.viewCount),
        platform: "youtube" as const,
        sourceUrl: `https://www.youtube.com/watch?v=${id}`,
        description: video.snippet?.description,
        channelTitle: video.snippet?.channelTitle,
        publishedAt: video.snippet?.publishedAt,
        likes: parseNonnegativeCount(video.statistics?.likeCount),
        comments: parseNonnegativeCount(video.statistics?.commentCount),
      }];
    }).slice(0, 10);
  }

}

interface YouTubeVideo {
  id?: string | { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    tags?: string[];
    categoryId?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

function getVideoId(video: YouTubeVideo): string | undefined {
  return typeof video.id === "string" ? video.id : video.id?.videoId;
}

function parseNonnegativeCount(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

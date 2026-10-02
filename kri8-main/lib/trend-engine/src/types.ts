export interface TrendingTopic {
  id: string;
  name: string;
  category: string;
  growthPercent: number | null;
  volume: number | null;
  platform: "youtube" | "tiktok" | "instagram" | "twitter" | "mock";
  sourceUrl?: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
  likes?: number | null;
  comments?: number | null;
}

export interface TrendingHashtag {
  tag: string;
  platform: string;
  volume: number | null;
  growthPercent: number | null;
}

export interface ContentCategory {
  name: string;
  growthPercent: number | null;
  topContent: string[];
}

export type TrendProviderName = "mock" | "youtube";
export type TrendMetricsQuality = "fixture" | "estimated" | "measured";
export type TrendDataKind = "fixture" | "popular_content" | "historical_trends";

/** One source observation; persistence can be added without changing its metric semantics. */
export interface TrendSnapshot {
  topic: string;
  platform: TrendingTopic["platform"];
  capturedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  rank: number | null;
}

export interface TrendDashboard {
  topics: TrendingTopic[];
  hashtags: TrendingHashtag[];
  categories: ContentCategory[];
  provider: TrendProviderName;
  source: TrendProviderName;
  fetchedAt: string | null;
  isStatic: boolean;
  metricsQuality: TrendMetricsQuality;
  dataKind: TrendDataKind;
  snapshots?: TrendSnapshot[];
}

export interface KeywordTrend {
  keyword: string;
  trendScore: number | null;
  relatedTopics: TrendingTopic[];
  relatedHashtags: TrendingHashtag[];
}

export interface IdeaAnalysisResult {
  canonicalQuery: string;
  relevanceScore: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  scoringEvidence: string[];
  relatedTopics: TrendingTopic[];
  relatedHashtags: TrendingHashtag[];
  contentOpportunities: string[];
  formatAdaptations: string[];
  suggestedAngles: string[];
  audienceFit?: string;
  differentiation?: string;
  recommendedHook?: string;
  risks?: string[];
}

export interface InspirationResult {
  canonicalQuery: string;
  relatedIdeas: string[];
  alternativeHooks: string[];
  titleSuggestions: string[];
  audienceQuestions: string[];
  source: "openai";
}

/** Implement this interface to add a new trend data source (TikTok, YouTube, etc.) */
export interface TrendProvider {
  readonly name: string;
  getDashboard(): Promise<TrendDashboard>;
  getKeywordTrends(keywords: string[]): Promise<KeywordTrend[]>;
}

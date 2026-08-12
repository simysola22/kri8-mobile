/**
 * SearchService
 *
 * Universal search architecture — searches all backend-supported categories simultaneously.
 * Results are grouped by category and returned in a single response.
 *
 * Current implementation: client-side filtering of cached data + API calls.
 * Prepared for server-side search: replace `searchCategory` with an API call.
 */
import { createStorage } from '@/lib/kv';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';
const recentStorage = createStorage('kri8-search');
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 8;

// ── Types ─────────────────────────────────────────────────────

export type SearchCategory =
  | 'ideas'
  | 'community'
  | 'trends';

export interface SearchResultItem {
  id: string | number;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  /** Deep-link path within the app. */
  route: string;
  /** Relevance score 0-1. */
  score: number;
}

export interface SearchResults {
  query: string;
  totalCount: number;
  groups: SearchGroup[];
  durationMs: number;
  /** True when one or more supported categories could not be queried. */
  hasErrors?: boolean;
}

export interface SearchGroup {
  category: SearchCategory;
  label: string;
  items: SearchResultItem[];
}

export function getRecentSearches(): string[] {
  const raw = recentStorage.getString(RECENT_SEARCHES_KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
      ? value
      : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  const normalized = query.trim();
  if (!normalized) return;
  const next = [
    normalized,
    ...getRecentSearches().filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);
  recentStorage.set(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function clearRecentSearches(): void {
  recentStorage.delete(RECENT_SEARCHES_KEY);
}

// ── Category labels ───────────────────────────────────────────

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  ideas: 'Ideas',
  community: 'People / Community',
  trends: 'Trends',
};

// ── API search ────────────────────────────────────────────────

async function searchIdeas(token: string, query: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ search: query, limit: '5' });
  const res = await fetch(`${API_BASE}/api/ideas?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throw new Error(`Ideas search failed (${res.status})`);
  const data = await res.json() as unknown;
  const ideas = extractArray(data, 'ideas') as Array<{ id: number; title?: string; insight?: string }>;
  return ideas.map((idea) => ({
    id: idea.id,
    title: idea.title ?? 'Untitled',
    subtitle: idea.insight,
    category: 'ideas' as const,
    route: `/(tabs)/ideas/${idea.id}`,
    score: 1,
  }));
}

async function searchCommunity(token: string, query: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_BASE}/api/users/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throw new Error(`Community search failed (${res.status})`);
  const data = await res.json() as unknown;
  const users = extractArray(data, 'users') as Array<{ id: number; name?: string; username?: string }>;
  return users.map((user) => ({
    id: user.id,
    title: user.name ?? user.username ?? 'Unknown',
    subtitle: user.username ? `@${user.username}` : undefined,
    category: 'community' as const,
    route: user.username ? `/(tabs)/profile/${user.username}` : '/(tabs)/community',
    score: 1,
  }));
}

async function searchTrends(token: string, query: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  const res = await fetch(`${API_BASE}/api/trends/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throw new Error(`Trend search failed (${res.status})`);
  const data = await res.json() as unknown;
  const q = query.toLowerCase();
  const topics = extractArray(data, 'topics') as Array<{
    id?: string | number;
    name?: string;
    title?: string;
    description?: string;
  }>;
  const hashtags = extractArray(data, 'hashtags') as Array<{
    tag?: string;
    platform?: string;
  }>;
  const categories = extractArray(data, 'categories') as Array<{ name?: string }>;

  return [
    ...topics
      .filter((topic) => (topic.name ?? topic.title ?? '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((topic, i) => ({
        id: topic.id ?? `topic-${i}`,
        title: topic.name ?? topic.title ?? '',
        subtitle: topic.description,
        category: 'trends' as const,
        route: '/(tabs)/ai',
        score: 0.8,
      })),
    ...hashtags
      .filter((hashtag) => hashtag.tag?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((hashtag, i) => ({
        id: `hashtag-${i}-${hashtag.tag ?? ''}`,
        title: `#${hashtag.tag ?? ''}`,
        subtitle: hashtag.platform,
        category: 'trends' as const,
        route: '/(tabs)/ai',
        score: 0.7,
      })),
    ...categories
      .filter((category) => category.name?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((category, i) => ({
        id: `category-${i}-${category.name ?? ''}`,
        title: category.name ?? '',
        category: 'trends' as const,
        route: '/(tabs)/ai',
        score: 0.6,
      })),
  ]
    .slice(0, 5)
}

// ── Main search ───────────────────────────────────────────────

/**
 * Perform a global search across all categories.
 * Returns grouped results sorted by relevance.
 */
export async function universalSearch(
  token: string,
  query: string,
  options?: { categories?: SearchCategory[]; signal?: AbortSignal },
): Promise<SearchResults> {
  const start = Date.now();
  const q = query.trim();
  if (!q) {
    return { query: '', totalCount: 0, groups: [], durationMs: 0 };
  }

  const categories = options?.categories ?? ['ideas', 'community', 'trends'];
  const signal = options?.signal;

  const [ideaResults, friendResults, trendResults] = await Promise.allSettled([
    categories.includes('ideas') ? searchIdeas(token, q, signal) : Promise.resolve([]),
    categories.includes('community') ? searchCommunity(token, q, signal) : Promise.resolve([]),
    categories.includes('trends') ? searchTrends(token, q, signal) : Promise.resolve([]),
  ]);

  const allResults: Record<SearchCategory, SearchResultItem[]> = {
    ideas: ideaResults.status === 'fulfilled' ? ideaResults.value : [],
    community: friendResults.status === 'fulfilled' ? friendResults.value : [],
    trends: trendResults.status === 'fulfilled' ? trendResults.value : [],
  };

  const groups: SearchGroup[] = Object.entries(allResults)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => ({
      category: category as SearchCategory,
      label: CATEGORY_LABELS[category as SearchCategory],
      items,
    }));

  const totalCount = groups.reduce((acc, g) => acc + g.items.length, 0);

  return {
    query: q,
    totalCount,
    groups,
    durationMs: Date.now() - start,
    hasErrors: [ideaResults, friendResults, trendResults].some(
      (result) => result.status === 'rejected',
    ),
  };
}

/** Accept the response shapes used by existing endpoints without inventing APIs. */
function extractArray(value: unknown, key: string): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key];
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.items)) return record.items;
  return [];
}

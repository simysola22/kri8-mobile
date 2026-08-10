/**
 * SearchService
 *
 * Universal search architecture — searches all content categories simultaneously.
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
  | 'friends'
  | 'messages'
  | 'trends'
  | 'tags'
  | 'calendar';

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
  friends: 'Friends',
  messages: 'Messages',
  trends: 'Trends',
  tags: 'Tags',
  calendar: 'Calendar',
};

// ── API search ────────────────────────────────────────────────

async function searchIdeas(token: string, query: string): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ search: query, limit: '5' });
  const res = await fetch(`${API_BASE}/api/ideas?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
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

async function searchFriends(token: string, query: string): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_BASE}/api/users/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Friends search failed (${res.status})`);
  const data = await res.json() as unknown;
  const users = extractArray(data, 'users') as Array<{ id: number; name?: string; username?: string }>;
  return users.map((user) => ({
    id: user.id,
    title: user.name ?? user.username ?? 'Unknown',
    subtitle: user.username ? `@${user.username}` : undefined,
    category: 'friends' as const,
    route: user.username ? `/(tabs)/profile/${user.username}` : '/(tabs)/community',
    score: 1,
  }));
}

async function searchTrends(token: string, query: string): Promise<SearchResultItem[]> {
  const res = await fetch(`${API_BASE}/api/trends/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Trend search failed (${res.status})`);
  const data = await res.json() as unknown;
  const trends = [
    ...extractArray(data, 'trends'),
    ...extractArray(data, 'topics'),
  ] as Array<{ id?: string | number; title?: string; description?: string }>;
  const q = query.toLowerCase();
  return trends
    .filter((t) => t.title?.toLowerCase().includes(q))
    .slice(0, 5)
    .map((t, i) => ({
      id: t.id ?? i,
      title: t.title ?? '',
      subtitle: t.description,
      category: 'trends' as const,
      route: '/(tabs)/ai',
      score: 0.8,
    }));
}

// ── Main search ───────────────────────────────────────────────

/**
 * Perform a global search across all categories.
 * Returns grouped results sorted by relevance.
 */
export async function universalSearch(
  token: string,
  query: string,
  options?: { categories?: SearchCategory[] },
): Promise<SearchResults> {
  const start = Date.now();
  const q = query.trim();
  if (!q) {
    return { query: '', totalCount: 0, groups: [], durationMs: 0 };
  }

  const categories = options?.categories ?? ['ideas', 'friends', 'trends'];

  const [ideaResults, friendResults, trendResults] = await Promise.allSettled([
    categories.includes('ideas') ? searchIdeas(token, q) : Promise.resolve([]),
    categories.includes('friends') ? searchFriends(token, q) : Promise.resolve([]),
    categories.includes('trends') ? searchTrends(token, q) : Promise.resolve([]),
  ]);

  const allResults: Record<SearchCategory, SearchResultItem[]> = {
    ideas: ideaResults.status === 'fulfilled' ? ideaResults.value : [],
    friends: friendResults.status === 'fulfilled' ? friendResults.value : [],
    messages: [],
    trends: trendResults.status === 'fulfilled' ? trendResults.value : [],
    tags: [],
    calendar: [],
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

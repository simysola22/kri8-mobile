/**
 * useUniversalSearch
 *
 * Global search hook — one query box, results grouped by category.
 * Debounces API calls and tracks search analytics.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as SearchService from '@/services/SearchService';
import { analytics } from '@/services/analytics/AnalyticsService';

const DEBOUNCE_MS = 300;

export interface UseUniversalSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: SearchService.SearchResults | null;
  isLoading: boolean;
  isError: boolean;
  clear: () => void;
}

export function useUniversalSearch(): UseUniversalSearchResult {
  const { getToken } = useAuth();
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchService.SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!query.trim()) {
      setResults(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      abortRef.current = new AbortController();

      try {
        const searchResults = await SearchService.universalSearch(token, query);
        setResults(searchResults);
        setIsError(searchResults.hasErrors === true && searchResults.totalCount === 0);
        analytics.track('search_performed', {
          query: query.slice(0, 50), // truncate for privacy
          totalCount: searchResults.totalCount,
          durationMs: searchResults.durationMs,
        });
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, getToken]);

  const clear = useCallback(() => {
    setQueryState('');
    setResults(null);
    setIsLoading(false);
    setIsError(false);
  }, []);

  return { query, setQuery, results, isLoading, isError, clear };
}

/**
 * useAIAssistant
 *
 * Contextual AI suggestions while the user types.
 * Debounces API calls — suggestions arrive automatically without
 * the user needing to press a button.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as AIAssistantService from '@/services/AIAssistantService';
import { analytics } from '@/services/analytics/AnalyticsService';

const DEBOUNCE_MS = 800; // Wait for a pause in typing before calling the API

export interface UseAIAssistantResult {
  suggestions: AIAssistantService.AISuggestions;
  isLoading: boolean;
  isError: boolean;
  /** Accept a suggestion field — tracks analytics. */
  acceptSuggestion: (field: keyof AIAssistantService.AISuggestions) => void;
  /** Dismiss all suggestions. */
  dismissSuggestions: () => void;
  /** Manually trigger suggestions (e.g. from a button). */
  triggerSuggestions: () => void;
}

export function useAIAssistant(
  context: AIAssistantService.AssistantContext,
): UseAIAssistantResult {
  const { getToken } = useAuth();
  const [suggestions, setSuggestions] = useState<AIAssistantService.AISuggestions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef(context);

  // Keep context ref current without triggering re-runs
  useEffect(() => {
    contextRef.current = context;
  });

  const fetchSuggestions = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    setIsError(false);
    try {
      const result = await AIAssistantService.getAISuggestions(token, contextRef.current);
      if (Object.keys(result).length > 0) {
        setSuggestions(result);
        analytics.track('ai_inspiration_requested');
      }
    } catch {
      // Non-fatal — AI suggestions never block typing.
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Auto-trigger on content changes (debounced)
  const { title, insight } = context;
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const hasContent = (title?.trim().length ?? 0) > 3 || (insight?.trim().length ?? 0) > 10;
    if (!hasContent) {
      setSuggestions({});
      setIsError(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, insight, fetchSuggestions]);

  const acceptSuggestion = useCallback((field: keyof AIAssistantService.AISuggestions) => {
    analytics.track('ai_suggestion_accepted', { field: String(field) });
  }, []);

  const dismissSuggestions = useCallback(() => {
    setSuggestions({});
    analytics.track('ai_suggestion_dismissed');
  }, []);

  const triggerSuggestions = useCallback(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    isError,
    acceptSuggestion,
    dismissSuggestions,
    triggerSuggestions,
  };
}

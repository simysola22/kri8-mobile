import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import type { TrendDashboard, TrendAnalysis, TrendInspiration, TrendCreatorBreakdown, TrendTopic } from '@/types';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  options?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const token = await getToken();
    const res = await fetch(`${BASE}/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      let message = `API request failed (${res.status})`;
      try {
        const body = await res.json() as { error?: unknown };
        if (typeof body.error === 'string' && body.error.trim()) {
          message = body.error;
        }
      } catch {
        // Keep the safe status-based message for empty or non-JSON responses.
      }
      throw new ApiRequestError(message, res.status);
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError('This request timed out. Please try again.', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function useTrendsDashboard() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['trends', 'dashboard'],
    queryFn: () => apiFetch<TrendDashboard>('/trends/dashboard', getToken),
    staleTime: 5 * 60 * 1000, // 5 min — trends don't change that fast
  });
}

export function useAnalyzeTrend() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; notes?: string }) => {
      const title = input.title.trim();
      const notes = input.notes?.trim();
      const result = await apiFetch<TrendAnalysis>('/trends/analyze', getToken, {
        method: 'POST',
        body: JSON.stringify({ title, notes: notes || undefined }),
      });
      if (!result.audienceFit || !result.recommendedHook) {
        throw new ApiRequestError('AI analysis is not available on this API server yet.', 503);
      }
      return result;
    },
  });
}

export function useGetInspiration() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; notes?: string }) => {
      const title = input.title.trim();
      const notes = input.notes?.trim();
      const result = await apiFetch<TrendInspiration>('/trends/inspire', getToken, {
        method: 'POST',
        body: JSON.stringify({ title, notes: notes || undefined }),
      });
      if (result.source !== 'openai') {
        throw new ApiRequestError('AI inspiration is not available on this API server yet.', 503);
      }
      return result;
    },
  });
}

export function useTrendContentBreakdown(topic: TrendTopic | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['trends', 'detail', topic?.id],
    enabled: !!topic,
    queryFn: () => apiFetch<TrendCreatorBreakdown>('/trends/detail', getToken, {
      method: 'POST',
      body: JSON.stringify({
        title: topic!.name,
        description: topic!.description ?? '',
        platform: topic!.platform,
        views: topic!.volume,
        likes: topic!.likes,
        comments: topic!.comments,
      }),
    }),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

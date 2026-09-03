import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import type { TrendDashboard, TrendAnalysis, TrendInspiration } from '@/types';

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
  const token = await getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
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
    mutationFn: (input: { title: string; notes?: string }) => {
      const title = input.title.trim();
      const notes = input.notes?.trim();
      return apiFetch<TrendAnalysis>('/trends/analyze', getToken, {
        method: 'POST',
        body: JSON.stringify({ title, notes: notes || undefined }),
      });
    },
  });
}

export function useGetInspiration() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: (input: { title: string; notes?: string }) => {
      const title = input.title.trim();
      const notes = input.notes?.trim();
      return apiFetch<TrendInspiration>('/trends/inspire', getToken, {
        method: 'POST',
        body: JSON.stringify({ title, notes: notes || undefined }),
      });
    },
  });
}

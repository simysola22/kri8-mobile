import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import type { TrendDashboard, TrendAnalysis, TrendInspiration } from '@/types';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

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
  if (!res.ok) throw new Error(`API error ${res.status}`);
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
    mutationFn: (input: { title: string; content?: string }) =>
      apiFetch<TrendAnalysis>('/trends/analyze', getToken, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useGetInspiration() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: (input?: { topic?: string }) =>
      apiFetch<TrendInspiration>('/trends/inspire', getToken, {
        method: 'POST',
        body: JSON.stringify(input ?? {}),
      }),
  });
}

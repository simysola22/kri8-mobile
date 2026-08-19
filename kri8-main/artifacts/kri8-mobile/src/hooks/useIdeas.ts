import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import type { Idea, IdeaDetail, IdeaInput, IdeaUpdate, IdeaStats } from '@/types';
import { enqueue } from '@/stores/offlineQueue';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  return /network request failed|failed to fetch|network error|timeout/i.test(error.message);
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
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Query keys ────────────────────────────────────────────────
export const ideaKeys = {
  all: ['ideas'] as const,
  list: (filters?: Record<string, unknown>) => ['ideas', 'list', filters] as const,
  detail: (id: number) => ['ideas', 'detail', id] as const,
  stats: () => ['ideas', 'stats'] as const,
  recent: (limit?: number) => ['ideas', 'recent', limit] as const,
  calendar: (month: string) => ['ideas', 'calendar', month] as const,
};

// ── Hooks ─────────────────────────────────────────────────────

export function useIdeas(filters?: { search?: string; is_used?: boolean }) {
  const { getToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.is_used !== undefined) params.set('is_used', String(filters.is_used));
  const qs = params.toString();

  return useQuery({
    queryKey: ideaKeys.list(filters),
    queryFn: () => apiFetch<Idea[]>(`/ideas${qs ? `?${qs}` : ''}`, getToken),
  });
}

export function useIdeaDetail(id: number) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ideaKeys.detail(id),
    queryFn: () => apiFetch<IdeaDetail>(`/ideas/${id}`, getToken),
  });
}

export function useIdeaStats() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ideaKeys.stats(),
    queryFn: () => apiFetch<IdeaStats>('/ideas/stats', getToken),
  });
}

export function useRecentIdeas(limit = 10) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ideaKeys.recent(limit),
    queryFn: () =>
      apiFetch<Idea[]>(`/ideas/recent?limit=${limit}`, getToken),
  });
}

export function useCalendarIdeas(month: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ideaKeys.calendar(month),
    queryFn: () =>
      apiFetch<Idea[]>(`/ideas/calendar?month=${month}`, getToken),
    enabled: !!month,
  });
}

export function useCreateIdea() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: IdeaInput) => {
      try {
        return await apiFetch<Idea>('/ideas', getToken, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      } catch (err) {
        // Only queue transport failures. Validation, auth, and server errors
        // must be shown immediately instead of replaying forever.
        if (isNetworkError(err)) {
          enqueue({ method: 'POST', path: '/ideas', body: input });
        }
        throw err;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ideaKeys.all });
    },
  });
}

export function useUpdateIdea() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: number; update: IdeaUpdate }) => {
      try {
        return await apiFetch<Idea>(`/ideas/${id}`, getToken, {
          method: 'PATCH',
          body: JSON.stringify(update),
        });
      } catch (err) {
        if (isNetworkError(err)) {
          enqueue({ method: 'PATCH', path: `/ideas/${id}`, body: update });
          throw new Error('Changes saved offline and will sync when you reconnect');
        }
        throw err;
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData(ideaKeys.detail(updated.id), (old: IdeaDetail | undefined) =>
        old ? { ...old, ...updated } : undefined,
      );
      void qc.invalidateQueries({ queryKey: ideaKeys.list() });
    },
  });
}

export function useDeleteIdea() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        await apiFetch<void>(`/ideas/${id}`, getToken, { method: 'DELETE' });
      } catch (err) {
        if (isNetworkError(err)) {
          enqueue({ method: 'DELETE', path: `/ideas/${id}` });
          throw new Error('Deletion saved offline and will sync when you reconnect');
        }
        throw err;
      }
    },
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ideaKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ideaKeys.list() });
      void qc.invalidateQueries({ queryKey: ideaKeys.stats() });
    },
  });
}

export function useMarkIdeaUsed() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, usedDate }: { id: number; usedDate?: string }) => {
      const body = usedDate ? { usedDate } : {};
      try {
        return await apiFetch<Idea>(`/ideas/${id}/mark-used`, getToken, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } catch (err) {
        if (isNetworkError(err)) {
          enqueue({ method: 'POST', path: `/ideas/${id}/mark-used`, body });
          throw new Error('Update saved offline and will sync when you reconnect');
        }
        throw err;
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData(ideaKeys.detail(updated.id), (old: IdeaDetail | undefined) =>
        old ? { ...old, ...updated } : undefined,
      );
      void qc.invalidateQueries({ queryKey: ideaKeys.list() });
    },
  });
}

export function useCreateBranch() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ideaId, title, insight }: { ideaId: number; title: string; insight?: string }) => {
      const body = { title, insight };
      try {
        return await apiFetch<Idea>(`/ideas/${ideaId}/branches`, getToken, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } catch (err) {
        if (isNetworkError(err)) {
          enqueue({ method: 'POST', path: `/ideas/${ideaId}/branches`, body });
          throw new Error('Branch saved offline and will sync when you reconnect');
        }
        throw err;
      }
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ideaKeys.detail(vars.ideaId) });
    },
  });
}

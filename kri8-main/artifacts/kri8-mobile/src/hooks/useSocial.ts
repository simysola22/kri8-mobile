import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useEffect, useState } from 'react';
import type { Conversation, FriendsList, FriendRequest, Message, UserPublic } from '@/types';

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
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : `API error ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

function extractArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  return [];
}

// ── Query keys ────────────────────────────────────────────────
export const socialKeys = {
  friends: () => ['social', 'friends'] as const,
  conversations: () => ['social', 'conversations'] as const,
  messages: (userId: number) => ['social', 'messages', userId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────

export function useFriends() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: socialKeys.friends(),
    queryFn: () => apiFetch<FriendsList>('/social/friends', getToken),
  });
}

export function useSearchUsers(query: string) {
  const { getToken } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const normalized = debouncedQuery;
  return useQuery({
    queryKey: ['social', 'user-search', normalized],
    enabled: normalized.length >= 2,
    queryFn: async () => {
      const response = await apiFetch<unknown>(
        `/users/search?q=${encodeURIComponent(normalized)}`,
        getToken,
      );
      return extractArray<UserPublic>(response, 'users');
    },
  });
}

export function useSendFriendRequest() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<FriendRequest>(`/social/friends/${userId}`, getToken, {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: socialKeys.friends() });
      void qc.invalidateQueries({ queryKey: ['social', 'user-search'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: number;
      status: 'accepted' | 'rejected';
    }) =>
      apiFetch<FriendRequest>(
        `/social/friends/${requestId}/respond`,
        getToken,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: socialKeys.friends() });
    },
  });
}

export function useMessages(userId: number) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: socialKeys.messages(userId),
    queryFn: () =>
      apiFetch<Message[]>(`/social/messages/${userId}`, getToken),
    // Refetch every 5 seconds as a lightweight alternative to SSE polling
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, content }: { userId: number; content: string }) =>
      apiFetch<Message>(`/social/messages/${userId}`, getToken, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: socialKeys.messages(vars.userId) });
      void qc.invalidateQueries({ queryKey: socialKeys.conversations() });
    },
  });
}

export function useConversations() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: socialKeys.conversations(),
    queryFn: () => apiFetch<Conversation[]>('/social/conversations', getToken),
    refetchInterval: 10000,
  });
}

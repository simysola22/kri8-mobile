import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import type { FriendsList, FriendRequest, Message } from '@/types';

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
    queryFn: () => apiFetch<unknown[]>('/social/conversations', getToken),
    refetchInterval: 10000,
  });
}

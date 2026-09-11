import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useEffect, useState } from 'react';
import { createApiClient } from '@/api/client';
import type { User, UserUpdate } from '@/types';

const QUERY_KEY = ['user', 'me'] as const;
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

export class UserApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'UserApiError';
    this.status = status;
  }
}

async function fetchMe(getToken: () => Promise<string | null>): Promise<User> {
  const api = createApiClient(getToken);
  const res = await fetch(
      `${BASE}/api/users/me`,
    {
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json() as Promise<User>;
}

/** Current authenticated user. */
export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchMe(getToken),
    enabled: !!isSignedIn,
  });
}

/** Update the current user's profile. */
export function useUpdateUser() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (update: UserUpdate) => {
      const token = await getToken();
      const res = await fetch(
        `${BASE}/api/users/me`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        },
      );
      if (!res.ok) {
        let message = `Failed to update user: ${res.status}`;
        try {
          const body = await res.json() as { error?: unknown };
          if (typeof body.error === 'string' && body.error.trim()) message = body.error;
        } catch {
          // Keep the status-based message when the API returns no JSON.
        }
        throw new UserApiError(message, res.status);
      }
      return res.json() as Promise<User>;
    },
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, updated);
      void qc.invalidateQueries({ queryKey: ['users', 'search'] });
      void qc.invalidateQueries({ queryKey: ['social', 'user-search'] });
    },
  });
}

export interface UsernameAvailability {
  available: boolean;
  username: string;
  reason?: string;
}

export function useUsernameAvailability(username: string) {
  const { getToken } = useAuth();
  const [debouncedUsername, setDebouncedUsername] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [username]);

  return useQuery({
    queryKey: ['users', 'username-availability', debouncedUsername],
    enabled: debouncedUsername.length >= 3,
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${BASE}/api/users/username-availability?username=${encodeURIComponent(debouncedUsername)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const body = await response.json() as UsernameAvailability | { error?: string };
      if (!response.ok) {
        throw new UserApiError(
          typeof body.error === 'string' ? body.error : 'Could not check username availability',
          response.status,
        );
      }
      return body as UsernameAvailability;
    },
  });
}

/** Search users by name or username. */
export function useUserSearch(q: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com'}/api/users/search?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: q.length >= 2,
  });
}

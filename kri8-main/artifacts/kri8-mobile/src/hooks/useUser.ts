import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';
import { createApiClient } from '@/api/client';
import type { User, UserUpdate } from '@/types';

const QUERY_KEY = ['user', 'me'] as const;

async function fetchMe(getToken: () => Promise<string | null>): Promise<User> {
  const api = createApiClient(getToken);
  const res = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com'}/api/users/me`,
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
        `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com'}/api/users/me`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        },
      );
      if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
      return res.json() as Promise<User>;
    },
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, updated);
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

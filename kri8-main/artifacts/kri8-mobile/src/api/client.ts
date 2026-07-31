import createClient, { type Middleware } from 'openapi-fetch';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

// ── Typed path map ─────────────────────────────────────────────
// We use a minimal hand-crafted paths type here.
// Phase 3+ can replace this with auto-generated types from orval.
export type paths = Record<string, unknown>;

// ── Base client (unauthenticated) ─────────────────────────────
const _baseClient = createClient<paths>({ baseUrl: `${API_BASE_URL}/api` });

// ── Auth-injected client factory ──────────────────────────────
/**
 * Creates an API client that injects a Clerk bearer token into every request.
 *
 * Usage:
 *   const { getToken } = useAuth();
 *   const api = createApiClient(getToken);
 *   const { data } = await api.GET('/users/me');
 */
export function createApiClient(getToken: () => Promise<string | null>) {
  const client = createClient<paths>({ baseUrl: `${API_BASE_URL}/api` });

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const token = await getToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    },
  };

  client.use(authMiddleware);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
export { API_BASE_URL };

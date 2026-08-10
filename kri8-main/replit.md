# Kri8

A creator-focused platform for capturing, organizing, and executing ideas — with a production backend, React web app, and React Native mobile app.

## Run & Operate

### Backend (API server)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` — Clerk auth

### Web app
- `pnpm --filter @workspace/kri8 run dev` — run the Vite frontend
- Required env: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`

### Mobile app (React Native / Expo)
- `pnpm --filter @workspace/kri8-mobile run start` — start the Expo development client
- `pnpm --filter @workspace/kri8-mobile run start:go -- --port 8082` — start Metro for Expo Go on the Replit mobile port (native modules may require a custom dev build)
- `pnpm --filter @workspace/kri8-mobile run prebuild` — regenerate native projects before an EAS development build
- Requires `.env.local` in `artifacts/kri8-mobile/` (copy from `.env.example`)
- Required env: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (same key as web app)
- Required env: `EXPO_PUBLIC_API_BASE_URL=https://kri8-obvh.onrender.com`
- Production target is iOS/Android; web support is retained only for Replit/Metro preview compatibility
- EAS build: `npx eas build --profile development` — build dev client for iOS/Android
- Replit workflow: `Kri8 Mobile Metro` — starts the Expo Go bundle on port 8082 so it does not conflict with the mockup preview server on port 8081
- Bundle ID: `space.kri8.mobile`

### Workspace
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

### Backend
- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 — `artifacts/api-server/`
- DB: PostgreSQL + Drizzle ORM — `lib/db/`
- Auth: Clerk (`@clerk/express`) — bearer token, no custom JWT
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Trend engine: `lib/trend-engine/` — mock or YouTube Data API
- Build: esbuild (CJS bundle)

### Mobile app (`artifacts/kri8-mobile/`)
- Expo SDK 54, React Native 0.81, React 19
- Routing: Expo Router v6 (file-based, typed routes)
- Auth: `@clerk/clerk-expo` — shared Clerk instance, session tokens stored in SecureStore
- Data: TanStack Query v5 + custom `apiFetch` wrapper
- Offline: MMKV-backed mutation queue + `useOfflineSync` SyncEngine
- Themes: 8 glassmorphism themes (Midnight · Ocean Deep · Monochrome · Cyber · Aurora · Nature · Sky · Crimson)
- Animation: `react-native-reanimated` + `react-native-gesture-handler`
- Haptics: `expo-haptics`
- Media (Phase 3): `expo-camera`, `expo-av`, `expo-image-picker`
- Push (Phase 3): `expo-notifications`
- Storage abstraction (Phase 3): `StorageService` → Cloudflare R2

## Where things live

| Path | What |
|---|---|
| `artifacts/kri8-mobile/app/` | Expo Router screens (file-based) |
| `artifacts/kri8-mobile/src/themes/` | All 8 theme definitions |
| `artifacts/kri8-mobile/src/components/ui/` | GlassCard, GlassButton, Avatar, Badge |
| `artifacts/kri8-mobile/src/hooks/` | TanStack Query wrappers for all API resources |
| `artifacts/kri8-mobile/src/stores/` | Theme store (MMKV-backed) + offline queue |
| `artifacts/api-server/src/routes/` | All backend route handlers |
| `lib/api-spec/openapi.yaml` | Single source of truth for API contract |
| `lib/db/src/` | Drizzle schema (tables: users, ideas, friendships, messages) |
| `MOBILE_ARCHITECTURE.md` | Full architecture proposal + StorageService design |

## Architecture decisions

- **Clerk shared instance**: Mobile app reuses the same Clerk publishable key as the web app. Users sign in once and their session works on both.
- **StorageService abstraction**: Media uploads go through a provider-agnostic interface (`StorageService`). Cloudflare R2 is Phase 3 provider. PostgreSQL stores only object keys, never full URLs.
- **Offline queue**: MMKV is used (not AsyncStorage) for synchronous reads needed by the SyncEngine on network restore. Queue survives app kill.
- **Direct-to-R2 uploads**: Mobile uploads go directly to R2 via presigned PUT URLs, not proxied through Express, to avoid memory/timeout constraints on the server.
- **No Replit SDK dependencies in mobile**: The mobile app is 100% portable — no `@replit/*` packages — so it can be built and deployed via EAS independently.

## User preferences

- StorageService must be provider-agnostic (R2/S3/local swappable via `STORAGE_PROVIDER` env var)
- No provider-specific logic outside `lib/storage/`; only object keys stored in PostgreSQL
- Mobile app must be deployable via EAS independently of Replit

## Gotchas

- `react-native-worklets/plugin` MUST be last in the Babel plugins array in `babel.config.js` (Reanimated 4)
- Expo Router's typed routes require `"experiments": { "typedRoutes": true }` in `app.json`
- Auth screens always use the Midnight theme (user prefs not yet loaded at that point)
- SSE (`/api/social/messages/:userId/stream`) requires `?token=` query param — already supported by the backend

## Pointers

- See `MOBILE_ARCHITECTURE.md` for full architecture proposal, storage design, and implementation roadmap
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

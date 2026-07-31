# Kri8 Mobile App — Architecture Proposal

> **Status:** Awaiting approval before any code is written.
> Generated from live backend audit of `kri8-main` on 2026-07-31.

---

## Step 1 — Backend Audit

### What Exists

The backend is an **Express 5** server (`artifacts/api-server`) backed by **PostgreSQL + Drizzle ORM** (`lib/db`).

**Database tables:**

| Table | Key columns |
|---|---|
| `users` | id, clerkUserId (unique), email, name, username, bio, avatarUrl, isPublic, themePreference |
| `ideas` | id, userId (FK), title, insight, origin, notes, videoEditingNotes, createdDate, usedDate, customDate, isUsed, branchCount, parentIdeaId |
| `friendships` | id, requesterId, addresseeId, status (pending/accepted/rejected) |
| `messages` | id, senderId, receiverId, content, isRead, createdAt |

**No tables for:** media/file attachments, voice recordings, push notification tokens, offline sync queue, or OCR results.

---

## Step 2 — Reusable API Audit

All endpoints live under `/api`. Every route requires a Clerk bearer token (or dev bypass).

### ✅ Fully reusable on mobile — no changes needed

| Method | Path | Mobile use |
|---|---|---|
| GET | `/healthz` | App startup check |
| GET | `/users/me` | Load current user profile |
| PATCH | `/users/me` | Edit profile, change theme |
| GET | `/users/search` | Find friends |
| GET | `/profile/:username` | View public profiles |
| GET | `/ideas` | Ideas list (with filters: search, isUsed, parent) |
| POST | `/ideas` | Create idea (text) |
| GET | `/ideas/stats` | Dashboard stats widget |
| GET | `/ideas/recent` | Home feed / widget data |
| GET | `/ideas/calendar` | Calendar view |
| GET | `/ideas/:id` | Idea detail |
| PATCH | `/ideas/:id` | Edit idea |
| DELETE | `/ideas/:id` | Delete idea |
| GET | `/ideas/:id/branches` | Branch list |
| POST | `/ideas/:id/branches` | Create branch |
| POST | `/ideas/:id/mark-used` | Mark used |
| GET | `/social/friends` | Friends list |
| POST | `/social/friends/:userId` | Send friend request |
| PATCH | `/social/friends/:requestId/respond` | Accept / reject |
| GET | `/social/messages/:userId` | Message history |
| POST | `/social/messages/:userId` | Send message |
| GET | `/social/messages/:userId/stream` | Real-time SSE (needs token-in-query support — ✅ already implemented) |
| GET | `/social/conversations` | Conversation list |
| GET | `/trends/dashboard` | Trends feed |
| POST | `/trends/analyze` | Analyze idea against trends |
| POST | `/trends/inspire` | AI inspiration |

### ⚠️ Gaps — new endpoints needed for mobile-specific features

| Feature | Missing endpoint | Priority |
|---|---|---|
| Push notifications | `POST /notifications/register` — store Expo push token per device | Phase 2 |
| Push notifications | `DELETE /notifications/register/:token` — unregister on logout | Phase 2 |
| File / image capture | `POST /ideas/:id/media` — attach image URLs (S3/CDN) to an idea | Phase 3 |
| Voice capture | `POST /capture/voice` — accept audio file, return AI-structured idea | Phase 3 |
| Camera OCR | `POST /capture/ocr` — accept image, return extracted text + AI-structured idea | Phase 4 |
| Offline sync | `POST /sync/bulk` — batch upsert locally-queued ideas & messages | Phase 3 |

The backend is otherwise **comprehensive** for a V1 mobile app. The four missing endpoints are additive and touch no existing routes.

---

## Step 3 — Authentication Audit

**Backend:** Clerk (`@clerk/express`). Every protected route calls `getAuth(req).userId`. The SSE endpoint supports a `?token=` query param promoted to `Authorization: Bearer` (already done). The Clerk proxy is production-only (`/api/__clerk`).

**Mobile implications:**

- Use `@clerk/clerk-expo` — Expo's official Clerk SDK.
- Clerk Expo uses `expo-secure-store` for session persistence.
- OAuth (Google, Apple) is supported natively through Clerk's Expo flows.
- The mobile app sends `Authorization: Bearer <session-token>` on every API call — identical to the web app, zero backend changes needed.
- For SSE on mobile: append `?token=<session-token>` (already supported).
- `CLERK_PUBLISHABLE_KEY` is needed in the mobile app; the Clerk proxy is not needed (mobile talks directly to Clerk's API).

**Required env for mobile build:**

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_API_BASE_URL=https://<production-api-url>
```

---

## Step 4 — Architecture Proposal

### Guiding constraints

1. **Backend is the single source of truth.** No business logic in the app.
2. **Zero Replit SDK dependencies.** The app must be deployable via Expo EAS to iOS and Android.
3. **Offline-first.** Every mutation queues locally and syncs when online.
4. **Reuse `lib/api-spec` OpenAPI** to generate a typed mobile API client (Orval or openapi-typescript-fetch).

### Technology decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Spec requirement; best DX for creator app |
| Routing | Expo Router v4 (file-based) | Spec requirement; deep linking, tab navigation |
| Auth | `@clerk/clerk-expo` | Matches backend; zero new auth endpoints |
| Data fetching | TanStack Query v5 (`@tanstack/react-query`) | Spec requirement; handles caching + background sync |
| Offline queue | `react-native-mmkv` + custom sync engine | Fastest storage on iOS/Android; survives app kill |
| API client | Auto-generated from `lib/api-spec/openapi.yaml` via `openapi-fetch` | Typed, stays in sync with backend contract |
| Styling | `react-native-reanimated` + `react-native-gesture-handler` | 60 FPS animations; spec requirement |
| Haptics | `expo-haptics` | Native haptic feedback |
| Camera | `expo-camera` + `expo-image-picker` | Camera-first creation |
| OCR | `@react-native-ml-kit/text-recognition` (device-side) or cloud via new endpoint | Phase 4 |
| Voice | `expo-av` (recording) → POST to `/capture/voice` | Phase 3 |
| Push | `expo-notifications` → register token via new `/notifications/register` | Phase 2 |
| Widgets | `expo-widgets` (iOS) + Android App Widgets via Expo config plugin | Phase 4 |
| Share Sheet | Expo Share Extension config plugin | Phase 4 |
| Themes | React Context + `StyleSheet.create` factory per theme | 8 themes from design spec |

### State architecture

```
┌─────────────────────────────────────┐
│           Expo Router               │  File-based navigation
│  (tabs) Home / Ideas / Capture /    │
│         Community / AI / Profile    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│        TanStack Query               │  Server state (API cache)
│  + Optimistic updates               │
│  + Background refetch               │
└─────────────┬───────────────────────┘
              │ on network fail
┌─────────────▼───────────────────────┐
│       Offline Queue (MMKV)          │  Persist mutations locally
│  + SyncEngine (background task)     │  Retry when online
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│     Kri8 REST API                   │  Existing + 4 new endpoints
│  Authorization: Bearer <clerk-token>│
└─────────────────────────────────────┘
```

### Theme engine

8 named themes from the spec. Each theme exports a palette object:

```ts
type Theme = {
  name: string
  bg: string          // primary background
  bgGlass: string     // glassmorphism surface (rgba with opacity)
  blur: number        // BlurView intensity
  accent: string      // primary accent color
  accentSoft: string  // soft accent for tags / chips
  text: string
  textMuted: string
  border: string      // glass border (rgba)
  gradient: [string, string]  // hero gradient
}
```

Themes: Midnight · Ocean Deep · Monochrome · Cyber · Aurora · Nature · Sky · Crimson.

Stored in `themePreference` on the user record — synced via `PATCH /users/me`.

---

## Step 5 — Folder Structure

The mobile app lives as a new workspace package: `artifacts/kri8-mobile/`.

```
artifacts/kri8-mobile/
├── app/                          # Expo Router — file-based routes
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # Home feed
│   │   ├── ideas/
│   │   │   ├── index.tsx         # Ideas list
│   │   │   └── [id].tsx          # Idea detail
│   │   ├── capture.tsx           # Central capture screen (camera/voice/text)
│   │   ├── community/
│   │   │   ├── index.tsx         # Friends + social feed
│   │   │   └── messages/
│   │   │       └── [userId].tsx  # Direct messages
│   │   ├── ai.tsx                # AI inspiration hub
│   │   └── profile/
│   │       ├── index.tsx         # Own profile
│   │       └── [username].tsx    # Public profile
│   ├── _layout.tsx               # Root layout (ClerkProvider, QueryProvider, ThemeProvider)
│   └── +not-found.tsx
│
├── src/
│   ├── api/
│   │   ├── client.ts             # openapi-fetch instance with Clerk token injector
│   │   └── generated/            # Auto-generated from lib/api-spec/openapi.yaml
│   │
│   ├── components/
│   │   ├── ui/                   # Primitives: GlassCard, GlassButton, Avatar, Badge
│   │   ├── ideas/                # IdeaCard, IdeaDetail, BranchList
│   │   ├── capture/              # CaptureSheet, VoiceRecorder, CameraCapture
│   │   ├── community/            # FriendCard, MessageBubble, ConversationItem
│   │   ├── trends/               # TrendCard, InspirationCard
│   │   └── navigation/           # TabBar (custom), Header
│   │
│   ├── hooks/
│   │   ├── useIdeas.ts           # TanStack Query wrappers for /ideas
│   │   ├── useUser.ts            # /users/me
│   │   ├── useSocial.ts          # friends + messages
│   │   ├── useTrends.ts          # trends + inspiration
│   │   └── useOfflineSync.ts     # Queue + sync engine
│   │
│   ├── stores/
│   │   ├── offlineQueue.ts       # MMKV-backed mutation queue
│   │   └── theme.ts              # Active theme store
│   │
│   ├── themes/
│   │   ├── index.ts              # Theme registry
│   │   ├── midnight.ts
│   │   ├── oceanDeep.ts
│   │   ├── monochrome.ts
│   │   ├── cyber.ts
│   │   ├── aurora.ts
│   │   ├── nature.ts
│   │   ├── sky.ts
│   │   └── crimson.ts
│   │
│   ├── lib/
│   │   ├── haptics.ts            # expo-haptics wrappers
│   │   ├── animations.ts         # Reanimated shared values / presets
│   │   └── notifications.ts      # Push token registration
│   │
│   └── types/
│       └── index.ts              # App-local types (extending API types)
│
├── assets/                       # Icons, splash, adaptive icon
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## Step 6 — Implementation Roadmap

### Phase 1 — Foundation (current: architecture approval) ✅
- [x] Backend audit
- [x] API audit
- [x] Auth audit
- [x] Architecture proposal
- [x] Folder structure

### Phase 2 — Project skeleton + auth + navigation + themes
- Scaffold `artifacts/kri8-mobile` Expo project in workspace
- Add to `pnpm-workspace.yaml`
- Install core dependencies
- Implement `ClerkProvider` + sign-in / sign-up screens (Clerk Expo)
- Implement bottom tab navigation (Home / Ideas / Capture / Community / AI / Profile)
- Implement theme engine + all 8 themes
- Implement `GlassCard`, `GlassButton`, `Avatar` primitive components
- Implement offline queue scaffold (MMKV, SyncEngine shell)
- **Gate:** app launches, authenticates, shows themed shell with tabs

### Phase 3 — Core features (Ideas + Capture + Messaging)
- Ideas list, detail, create, edit, delete, branches
- Optimistic mutations with offline queue fallback
- Capture screen: text, camera (photo), voice recorder → `/capture/voice`
- Attach media to ideas via new `/ideas/:id/media` endpoint
- `POST /sync/bulk` endpoint + SyncEngine implementation
- Community: friend list, friend requests, direct messages (SSE)
- **Gate:** full offline-capable idea CRUD + messaging works end-to-end

### Phase 4 — AI + advanced mobile features
- AI hub screen: trends dashboard, inspiration, per-idea AI actions
- Camera OCR: capture image → extract text → create idea
- Push notifications: register Expo token → `/notifications/register`
- Home screen widgets (iOS + Android)
- Share Sheet extension
- Lock screen quick-capture widget
- **Gate:** all capture modalities work; push notifications deliver

### Phase 5 — Polish + accessibility + deployment
- Haptic feedback pass across all interactions
- Shared element transitions + animated tab changes
- Reduce-motion / large-text / screen reader pass
- High-contrast verification across all 8 themes
- Performance profiling (React Native Perf Monitor, Flashlight)
- EAS build configuration (development / preview / production profiles)
- App Store + Play Store submission prep
- **Gate:** passes accessibility audit; EAS builds succeed for both platforms

### New backend endpoints (additive only, no existing routes changed)

| Phase | Method | Path | Purpose |
|---|---|---|---|
| 2 | POST | `/notifications/register` | Store Expo push token |
| 2 | DELETE | `/notifications/register/:token` | Unregister on logout |
| 3 | POST | `/capture/voice` | Audio → AI-structured idea |
| 3 | POST | `/ideas/:id/media` | Attach image URL to idea |
| 3 | POST | `/sync/bulk` | Batch upsert offline queue |
| 4 | POST | `/capture/ocr` | Image → OCR text → AI idea |

---

---

## Confirmed Configuration ✅

| Item | Value |
|---|---|
| API base URL | `https://kri8-obvh.onrender.com` |
| Clerk instance | Shared with web app (same publishable key) |
| Bundle ID (iOS / Android) | `space.kri8.mobile` |
| Media storage provider | Cloudflare R2 (S3-compatible), behind `StorageService` abstraction |

---

## Storage Architecture — `StorageService` Abstraction

Per the user's requirement: provider-specific logic must be isolated behind a single interface. Application code — mobile and backend — never calls R2/S3 SDKs directly.

### Interface

```ts
interface StorageService {
  /** Generate a signed URL the client uploads directly to (PUT). */
  getUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>

  /** Generate a signed URL for time-limited download access (GET). */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>

  /** Delete an object. */
  delete(key: string): Promise<void>

  /** Derive the permanent public-CDN URL for a key (read-only bucket / CDN). */
  publicUrl(key: string): string
}
```

### Key naming convention

```
<mediaType>/<userId>/<uuid>.<ext>

Examples:
  avatars/usr_abc123/f47ac10b.jpg
  ideas/usr_abc123/idea_456/a3f8c2d1.jpg
  voice/usr_abc123/idea_456/rec_9b2e3f01.m4a
  ocr/usr_abc123/idea_456/scan_7c4d5a02.jpg
```

### Backend endpoints updated with StorageService

| Method | Path | What it does |
|---|---|---|
| POST | `/media/upload-url` | Mobile calls this → gets a signed PUT URL → uploads directly to R2 → sends back the key |
| GET | `/media/download-url/:key` | Returns short-lived signed GET URL for private objects |
| DELETE | `/media/:key` | Deletes object from R2; requires ownership check |
| PATCH | `/users/me` | Existing endpoint; `avatarUrl` is now a stored object key (resolved to URL server-side) |
| POST | `/ideas/:id/media` | Stores object key + mediaType in a new `idea_media` table |

### New `idea_media` table

```sql
idea_media (
  id          serial PRIMARY KEY,
  ideaId      integer NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  userId      integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mediaType   text NOT NULL,   -- 'image' | 'voice' | 'ocr_image'
  storageKey  text NOT NULL,   -- object key in R2 (never the full URL)
  mimeType    text,
  durationMs  integer,         -- voice recordings
  transcript  text,            -- voice/OCR extracted text
  createdAt   timestamptz DEFAULT now()
)
```

PostgreSQL stores **only object keys**. URLs are generated on demand via `StorageService.getDownloadUrl()` or `StorageService.publicUrl()`.

### Provider implementations

```
lib/storage/
├── src/
│   ├── index.ts            # exports StorageService interface + factory
│   ├── r2.ts               # Cloudflare R2 implementation (aws4fetch + R2 S3 API)
│   ├── s3.ts               # AWS S3 implementation (future swap)
│   └── local.ts            # Local filesystem mock (development / testing)
├── package.json
└── tsconfig.json
```

`STORAGE_PROVIDER=r2|s3|local` env var selects the implementation at startup. Required R2 env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (CDN domain).

### Mobile upload flow

```
1. Mobile picks file (camera / voice / files picker)
2. POST /media/upload-url  { contentType, mediaType }
   ← { uploadUrl, key }
3. Mobile PUT <file> directly to uploadUrl (R2 presigned)
4. POST /ideas/:id/media   { key, mediaType, mimeType, durationMs? }
   ← IdeaMedia record
5. React Query invalidates idea detail cache
```

Direct-to-R2 upload avoids proxying large files through the Express server.

---

## Updated New Backend Endpoints

| Phase | Method | Path | Purpose |
|---|---|---|---|
| 2 | POST | `/notifications/register` | Store Expo push token |
| 2 | DELETE | `/notifications/register/:token` | Unregister on logout |
| 2 | POST | `/media/upload-url` | Presigned PUT URL for direct R2 upload |
| 2 | GET | `/media/download-url/:key` | Presigned GET URL for private media |
| 2 | DELETE | `/media/:key` | Delete media object + DB record |
| 3 | POST | `/capture/voice` | Voice upload key → AI-structured idea |
| 3 | POST | `/ideas/:id/media` | Attach media key to idea |
| 3 | POST | `/sync/bulk` | Batch upsert offline queue |
| 4 | POST | `/capture/ocr` | Image key → OCR text → AI idea |

---

## Architecture Approval Checklist

- [ ] API base URL confirmed (`https://kri8-obvh.onrender.com`)
- [ ] Clerk shared instance confirmed
- [ ] Bundle ID confirmed (`space.kri8.mobile`)
- [ ] StorageService abstraction design approved
- [ ] `idea_media` table design approved
- [ ] New endpoint list approved
- [x] **Approved to begin Phase 2 (scaffold + auth + navigation + themes)**
- [x] **Phase 2 COMPLETE** — scaffold, auth, navigation, all 8 themes, offline queue

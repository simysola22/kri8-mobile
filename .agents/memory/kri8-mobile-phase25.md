---
name: Kri8 mobile Phase 2.5 — platform foundation services
description: What was built in Phase 2.5 and where each feature lives
---

All 12 Phase 2.5 features implemented. Zero new TypeScript errors introduced.

**Services (src/services/):**
- BiometricService — expo-local-authentication wrapper; isBiometricEnabled() persisted in MMKV
- DraftService — MMKV-backed draft persistence for new and edit idea flows
- CaptureDetectionService — regex-based content type routing (YouTube/TikTok/Instagram/X/URL/text)
- SearchService — universalSearch() calls /api/ideas, /api/users/search, /api/trends/dashboard in parallel
- AIAssistantService — getAISuggestions() calls /api/trends/inspire; analyzeIdeaAgainstTrends() calls /api/trends/analyze
- NotificationService — channels, iOS action categories, push token registration with backend
- StorageService — signed R2 upload/download URL architecture; objectKey-only DB storage pattern
- CreatorScoreService — local signal buffer + /api/users/{id}/creator-score fetch
- analytics/AnalyticsService — provider-independent; ConsoleAnalyticsProvider in __DEV__
- subscription/SubscriptionService, FeatureFlagService, EntitlementService — all gates open at launch

**Hooks (src/hooks/):**
- useBiometric — availability check, enable toggle, authenticate()
- useDraft — auto-save on keystroke (500ms debounce), restore on mount
- useUniversalSearch — 300ms debounce, grouped results
- useAIAssistant — 800ms debounce, auto-triggers on title/insight changes
- useSyncStatus — polls queue size every 2s, listens to NetInfo
- useOfflineSync (updated) — added AppState resume trigger + analytics tracking

**Components (src/components/ui/):**
- PremiumGate — renders children directly when gate open; upgrade prompt when closed
- SyncStatusIndicator — shows offline/syncing/pending states; invisible when synced
- UniversalSearchBar — full grouped results UI with FlatList

**app/_layout.tsx:** wires analytics identity, push notification setup, notification action routing, deep link handling from notification payloads.

**app.json:** added expo-local-authentication plugin, iOS associatedDomains for kri8.space universal links, Android intentFilters for https://kri8.space.

**Why:** Spec required provider-independent architecture throughout — analytics, storage, subscriptions all have swappable provider interfaces.

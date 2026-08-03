---
name: Kri8 mobile KV module resolution
description: Why kv.ts stub is needed and how platform resolution works
---

The mobile app uses `@/lib/kv` which Metro resolves to `kv.native.ts` (MMKV) or `kv.web.ts` (localStorage) depending on platform. TypeScript (tsc) has no knowledge of Metro's platform-extension resolution, so it can't find `@/lib/kv` at all unless a plain `kv.ts` exists.

**Fix:** `src/lib/kv.ts` re-exports from `kv.web.ts` — tsc is satisfied, Metro ignores it on native (picks `kv.native.ts` first).

**Why:** Without this stub, any new service that imports `@/lib/kv` will fail tsc even though it runs fine at runtime.

**How to apply:** Any new file in the mobile app that needs KV storage should import from `@/lib/kv` — no changes needed as long as `src/lib/kv.ts` exists.

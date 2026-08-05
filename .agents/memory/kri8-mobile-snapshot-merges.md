---
name: Kri8 mobile snapshot merges
description: How to safely merge exported mobile snapshots into the active Kri8 workspace.
---

When merging a Kri8 mobile snapshot, treat its mobile package manifest as authoritative but regenerate the monorepo lockfile from that manifest. Exported snapshots can contain a stale lockfile that still resolves an older Expo SDK even when `package.json` declares a newer SDK.

**Why:** The uploaded fixed snapshot declared Expo SDK 54 while its lockfile still resolved Expo SDK 53, which would produce an inconsistent install.

**How to apply:** Compare source files before copying; merge only verified mobile changes, then run `pnpm install` from `kri8-main` and validate the mobile package independently.
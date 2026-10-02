---
name: Kri8 trend data quality
description: Rules for keeping trend metrics grounded in the provider's available evidence.
---

Do not infer historical growth or search volume from a single snapshot of popular videos. Keep unsupported metrics unavailable (`null`) rather than displaying zero or a fabricated estimate. Mock-provider metrics may be used only in development and tests, and must be visibly identified as fixture data.

**Why:** the user requested that trend analysis not present unsupported or fabricated metrics as real measurements.

**How to apply:** when changing trend providers, API contracts, or trend UI, preserve unavailable values and their disclosure; do not let fixture data appear as live provider data.
---
name: Generated API client codegen
description: Durable guidance for regenerating the OpenAPI-derived TypeScript and Zod clients.
---

The current Orval output can expose the same parameter name from both the generated Zod schemas and generated type barrels. Regeneration may also append duplicate exports to the package barrel.

**Why:** A successful Orval run does not guarantee that the generated library typechecks; duplicate exports only surface during the follow-up TypeScript build.

**How to apply:** After changing the OpenAPI contract, regenerate the clients and immediately run the library typecheck. Resolve duplicate barrel exports before considering the contract update complete.
---
name: Kri8 mobile API contracts
description: Contract alignment rules for mobile integrations with the existing Kri8 API.
---

Mobile feature services must use the payload and response shapes implemented by the existing API routes; do not infer a separate client contract from service names or older comments.

**Why:** The AI assistant service previously sent an unsupported prompt/mode payload to the existing trends inspiration endpoint, which requires title/notes and returns structured inspiration arrays.

**How to apply:** Before changing a mobile service, compare its request and response types with the corresponding route in `artifacts/api-server/src/routes` and the backing library contract.
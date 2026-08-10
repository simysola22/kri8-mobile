---
name: Kri8 mobile Replit setup
description: Replit-specific Expo Metro, Expo Router preview, and Clerk dependency requirements for the Kri8 mobile artifact.
---

Use a dedicated Metro port for the mobile workflow when the mockup preview server is also running; the default Expo port can be occupied. Keep the Expo web adapter installed so Replit's preview probe can bundle Expo Router, even though iOS/Android are the production targets. `@clerk/clerk-expo` also needs `expo-auth-session` explicitly available in the mobile workspace.

**Why:** Replit runs the mobile Metro server alongside the mockup preview, and Expo Router's server-side preview path loads web and Clerk peer modules even for a native-focused app.

**How to apply:** Check the active workflow ports before starting Metro; keep `react-native-web` and `expo-auth-session` in the mobile package, use `react-native-worklets/plugin` last for Reanimated 4, and show a setup screen rather than throwing when the Clerk publishable key is absent.
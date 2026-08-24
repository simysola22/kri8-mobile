---
name: Kri8 Clerk hosted auth
description: The supported Clerk Expo hosted Account Portal pattern and SDK compatibility constraint.
---

Use Clerk's current Expo SDK package, `@clerk/expo`, and its `useHostedAuth` hook from `@clerk/expo/hosted-auth` for hosted Account Portal sign-in and sign-up. The deprecated `@clerk/clerk-expo` package does not expose this hook.

**Why:** The hosted-auth API is versioned with the current Clerk Expo SDK; mixing the deprecated and current Clerk packages can create incompatible provider/session behavior.

**How to apply:** For native hosted authentication, pass `mode: 'sign-in'` or `'sign-up'` and a registered non-HTTP callback such as the app's custom scheme. Keep all mobile Clerk imports on the same current package.
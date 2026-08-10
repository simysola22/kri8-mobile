# Kri8

A multi-artifact monorepo for the **Kri8** idea-management platform.

## Artifacts

| Artifact | Path | Stack |
|---|---|---|
| Web app | `artifacts/kri8` | React 19 + Vite + Tailwind |
| API server | `artifacts/api-server` | Express 5 + PostgreSQL + Drizzle ORM |
| Mobile app | `artifacts/kri8-mobile` | Expo 54 (React Native 0.81) + Expo Router |
| Mockup sandbox | `artifacts/mockup-sandbox` | Vite component preview server |

## Key dependencies / services

- **Auth:** Clerk (`@clerk/express` on the server, `@clerk/clerk-expo` on mobile)
- **Database:** PostgreSQL 16 (Drizzle ORM, schema lives in the `@workspace/db` lib)
- **Package manager:** pnpm workspaces

## How to run

Dependencies must be installed first from the workspace root:

```bash
pnpm install
```

### API server
```bash
cd artifacts/api-server && pnpm run dev
```
Requires `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `DATABASE_URL` environment variables.

### Web app
```bash
cd artifacts/kri8 && pnpm run dev
```
Requires `VITE_CLERK_PUBLISHABLE_KEY`.

### Mobile (Metro bundler)
```bash
cd artifacts/kri8-mobile && pnpm run start:go -- --localhost --port 8082
```
Requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL`.

## User preferences

<!-- Agent: record user preferences here -->

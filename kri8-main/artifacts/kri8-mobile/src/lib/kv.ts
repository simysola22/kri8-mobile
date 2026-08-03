/**
 * Key-value storage — TypeScript type stub.
 *
 * Metro resolves the correct platform implementation automatically:
 *   kv.native.ts  → iOS and Android (MMKV)
 *   kv.web.ts     → Web (localStorage)
 *
 * This file exists solely so TypeScript (tsc) can resolve `@/lib/kv`
 * without Metro's platform-extension resolution. It re-exports the
 * web implementation's types and runtime (safe for tsc; never bundled
 * on native because Metro picks kv.native.ts first).
 */
export type { KVStorage } from './kv.web';
export { createStorage } from './kv.web';

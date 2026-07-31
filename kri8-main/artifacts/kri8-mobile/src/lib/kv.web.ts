/**
 * Key-value storage — web implementation backed by localStorage.
 * Resolved by Metro on web. Never bundled on iOS / Android.
 */

export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export function createStorage(id: string): KVStorage {
  const prefix = `kri8:${id}:`;
  return {
    getString(key) {
      try {
        return localStorage.getItem(prefix + key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(prefix + key, value);
      } catch {
        // Quota exceeded or private browsing — silently ignore
      }
    },
    delete(key) {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // Silently ignore
      }
    },
  };
}

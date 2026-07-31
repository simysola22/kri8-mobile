/**
 * Key-value storage — native implementation backed by MMKV.
 * Resolved by Metro on iOS and Android. Never bundled on web.
 */
import { MMKV } from 'react-native-mmkv';

export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export function createStorage(id: string): KVStorage {
  return new MMKV({ id });
}

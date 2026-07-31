/**
 * Offline mutation queue backed by MMKV.
 *
 * Mutations that fail because the device is offline are stored here.
 * The SyncEngine processes them in order when connectivity returns.
 */
import { MMKV } from 'react-native-mmkv';
import type { QueuedMutation } from '@/types';

const storage = new MMKV({ id: 'kri8-offline-queue' });
const QUEUE_KEY = 'queue';

function readQueue(): QueuedMutation[] {
  const raw = storage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedMutation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

// ── Public API ────────────────────────────────────────────────

/** Add a mutation to the end of the queue. */
export function enqueue(
  mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>,
): QueuedMutation {
  const item: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 5,
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

/** Remove a successfully synced mutation by id. */
export function dequeue(id: string): void {
  const queue = readQueue().filter((m) => m.id !== id);
  writeQueue(queue);
}

/** Increment retry counter; remove if max retries exceeded. */
export function incrementRetry(id: string): boolean {
  const queue = readQueue();
  const idx = queue.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  const item = queue[idx]!;
  if (item.retryCount >= item.maxRetries) {
    queue.splice(idx, 1);
    writeQueue(queue);
    return false; // dropped
  }
  item.retryCount += 1;
  writeQueue(queue);
  return true; // still queued
}

/** Return all queued mutations ordered by timestamp. */
export function getQueue(): QueuedMutation[] {
  return readQueue();
}

/** Return the number of pending mutations. */
export function getQueueSize(): number {
  return readQueue().length;
}

/** Clear the entire queue (e.g. on sign-out). */
export function clearQueue(): void {
  storage.delete(QUEUE_KEY);
}

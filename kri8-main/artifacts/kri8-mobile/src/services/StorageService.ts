/**
 * StorageService
 *
 * Provider-independent media storage layer backed by Cloudflare R2.
 * Provider-specific code stays behind this interface.
 *
 * Only object keys are stored in PostgreSQL. Signed URLs are generated
 * here and never persisted.
 *
 * Supported media:
 *  - Profile photos
 *  - Idea images
 *  - Voice recordings
 *  - OCR images
 *  - Future video uploads
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

// ── Types ─────────────────────────────────────────────────────

export type MediaCategory =
  | 'profile_photo'
  | 'idea_image'
  | 'voice_recording'
  | 'ocr_image'
  | 'video';

export interface UploadIntent {
  /** Object key to store in the database. */
  objectKey: string;
  /** Pre-signed URL for the client to PUT the file directly to R2. */
  uploadUrl: string;
  /** Time after which the upload URL expires (Unix ms). */
  expiresAt: number;
}

export interface DownloadIntent {
  /** Pre-signed URL to read the object. */
  downloadUrl: string;
  expiresAt: number;
}

// ── Object key generation ─────────────────────────────────────

/**
 * Generate a deterministic object key.
 * Format: {category}/{userId}/{timestamp}-{random}.{ext}
 */
export function generateObjectKey(
  category: MediaCategory,
  userId: string | number,
  extension: string,
): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${category}/${userId}/${ts}-${rand}.${extension}`;
}

// ── Upload ────────────────────────────────────────────────────

/**
 * Request a signed upload URL from the API.
 * The caller should PUT the file bytes directly to `uploadUrl`.
 */
export async function requestUploadUrl(
  token: string,
  objectKey: string,
  contentType: string,
): Promise<UploadIntent> {
  const res = await fetch(`${API_BASE}/api/storage/upload-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objectKey, contentType }),
  });

  if (!res.ok) {
    throw new Error(`StorageService: upload URL request failed (${res.status})`);
  }

  return res.json() as Promise<UploadIntent>;
}

/**
 * Upload a file to R2 using a pre-signed URL.
 * Returns the objectKey so the caller can store it in the DB.
 */
export async function uploadFile(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error(`StorageService: upload failed (${putRes.status})`);
  }
}

// ── Download ──────────────────────────────────────────────────

/**
 * Request a signed download URL for an object key.
 */
export async function requestDownloadUrl(
  token: string,
  objectKey: string,
): Promise<DownloadIntent> {
  const params = new URLSearchParams({ objectKey });
  const res = await fetch(`${API_BASE}/api/storage/download-url?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`StorageService: download URL request failed (${res.status})`);
  }

  return res.json() as Promise<DownloadIntent>;
}

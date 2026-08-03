/**
 * CaptureDetectionService
 *
 * Intelligently identifies capture content type so the Capture workflow
 * can route users without asking unnecessary questions.
 *
 * Does NOT implement OCR yet — only builds the routing architecture.
 */

// ── Types ─────────────────────────────────────────────────────

export type CaptureContentType =
  | 'plain_text'
  | 'url'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'x_post'
  | 'voice_recording'
  | 'image'
  | 'screenshot'
  | 'unknown';

export interface CaptureDetectionResult {
  type: CaptureContentType;
  /** Normalized URL if applicable. */
  url?: string;
  /** Extracted video/post ID if applicable. */
  contentId?: string;
  /** Confidence score 0-1. */
  confidence: number;
}

// ── Regex patterns ────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

const TIKTOK_PATTERNS = [
  /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
  /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
];

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
  /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
  /instagram\.com\/stories\/[\w.]+\/(\d+)/,
];

const X_POST_PATTERNS = [
  /(?:twitter|x)\.com\/\w+\/status\/(\d+)/,
];

const URL_PATTERN = /^https?:\/\/[^\s]+$/;

// ── Detection ─────────────────────────────────────────────────

/**
 * Detect the content type from a text string (e.g. clipboard paste or typed input).
 */
export function detectTextContent(input: string): CaptureDetectionResult {
  const trimmed = input.trim();

  // Try YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: 'youtube',
        url: trimmed,
        contentId: match[1],
        confidence: 1,
      };
    }
  }

  // Try TikTok
  for (const pattern of TIKTOK_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: 'tiktok',
        url: trimmed,
        contentId: match[1],
        confidence: 1,
      };
    }
  }

  // Try Instagram
  for (const pattern of INSTAGRAM_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: 'instagram',
        url: trimmed,
        contentId: match[1],
        confidence: 1,
      };
    }
  }

  // Try X/Twitter
  for (const pattern of X_POST_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: 'x_post',
        url: trimmed,
        contentId: match[1],
        confidence: 1,
      };
    }
  }

  // Generic URL
  if (URL_PATTERN.test(trimmed)) {
    return { type: 'url', url: trimmed, confidence: 0.95 };
  }

  // Plain text
  if (trimmed.length > 0) {
    return { type: 'plain_text', confidence: 1 };
  }

  return { type: 'unknown', confidence: 0 };
}

/**
 * Detect content type from a media MIME type (for image/audio file captures).
 */
export function detectMediaContent(
  mimeType: string,
  metadata?: { isScreenshot?: boolean },
): CaptureDetectionResult {
  if (mimeType.startsWith('audio/')) {
    return { type: 'voice_recording', confidence: 1 };
  }

  if (mimeType.startsWith('image/')) {
    if (metadata?.isScreenshot) {
      return { type: 'screenshot', confidence: 0.9 };
    }
    return { type: 'image', confidence: 1 };
  }

  return { type: 'unknown', confidence: 0 };
}

/**
 * Returns a human-readable label for a content type.
 */
export function contentTypeLabel(type: CaptureContentType): string {
  const labels: Record<CaptureContentType, string> = {
    plain_text: 'Text',
    url: 'Link',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    x_post: 'X Post',
    voice_recording: 'Voice',
    image: 'Image',
    screenshot: 'Screenshot',
    unknown: 'Unknown',
  };
  return labels[type];
}

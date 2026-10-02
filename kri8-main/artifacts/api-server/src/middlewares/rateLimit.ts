import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const windowMs = 15 * 60 * 1000; // 15 minutes

/** Global catch-all: 300 req / 15 min per IP */
export const globalLimiter = rateLimit({
  windowMs,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Writes (POST/PATCH/DELETE): 60 req / 15 min per IP */
export const writeLimiter = rateLimit({
  windowMs,
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Write rate limit exceeded, please slow down." },
  skip: (req) => req.method === "GET" || req.method === "HEAD",
});

/** Search: 120 req / 15 min per IP (still needs to feel snappy) */
export const searchLimiter = rateLimit({
  windowMs,
  max: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Search rate limit exceeded." },
});

/** SSE / streaming: 10 connections per IP (long-lived) */
export const sseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many streaming connections." },
});

/** Shared limit for routes that invoke paid AI APIs. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "AI request limit exceeded. Please try again later.", code: "AI_RATE_LIMITED" },
  keyGenerator: (req) => {
    const userId = (req as typeof req & { clerkUserId?: string }).clerkUserId;
    return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip ?? "127.0.0.1")}`;
  },
});

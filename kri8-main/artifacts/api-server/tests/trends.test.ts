import assert from "node:assert/strict";
import { test } from "node:test";
import express, { type Request, type RequestHandler } from "express";
import type { AddressInfo } from "node:net";
import {
  AIProviderError,
  inspirationContentSchema,
  parseAIResponse,
  type TrendProvider,
} from "@workspace/trend-engine";
import { aiLimiter } from "../src/middlewares/rateLimit.js";
import { createTrendsRouter } from "../src/routes/trends.js";
import type { TrendDashboard } from "@workspace/trend-engine";

const authenticate: RequestHandler = (req, _res, next) => {
  (req as Request & { clerkUserId?: string }).clerkUserId = "ai-test-user";
  next();
};

const emptyDashboard: TrendDashboard = {
  topics: [],
  hashtags: [],
  categories: [],
  provider: "youtube",
  source: "youtube",
  fetchedAt: null,
  isStatic: false,
  metricsQuality: "measured",
  dataKind: "popular_content",
};

const provider: TrendProvider = {
  name: "youtube",
  async getDashboard() { return emptyDashboard; },
  async getKeywordTrends() { return []; },
};

test("AI response parsing rejects malformed payloads and strips unknown fields", () => {
  assert.throws(
    () => parseAIResponse(inspirationContentSchema, { relatedIdeas: "not-an-array" }),
    (error: unknown) =>
      error instanceof AIProviderError && error.category === "malformed_output",
  );
  const parsed = parseAIResponse(inspirationContentSchema, {
    relatedIdeas: ["A distinct creator angle", "A second angle", "A third angle"],
    alternativeHooks: ["A clear opening", "A surprising opening", "A question opening"],
    titleSuggestions: ["A specific title", "A second title", "A third title"],
    audienceQuestions: ["What would you try?", "Who is this for?", "What changes?"],
    internalPrompt: "must not escape",
  });
  assert.equal("internalPrompt" in parsed, false);
});

async function start(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use((req: Request & { log?: { error: () => void; warn: () => void } }, _res, next) => {
    req.log = { error: () => undefined, warn: () => undefined };
    next();
  });
  app.use("/api/trends", router);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/api/trends`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    ),
  };
}

test("AI quota failures are exposed as a distinct, safe API error", async () => {
  const server = await start(createTrendsRouter({
    authenticate,
    aiRateLimit: (_req, _res, next) => next(),
    createProvider: () => provider,
    generateInspiration: async () => {
      throw new AIProviderError("quota_exhausted", false, 429);
    },
  }));

  try {
    const response = await fetch(`${server.url}/inspire`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "A valid idea" }),
    });
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), {
      error: "AI inspiration quota is exhausted",
      code: "AI_QUOTA_EXHAUSTED",
    });
  } finally {
    await server.close();
  }
});

test("malformed trend inputs are rejected before invoking the AI provider", async () => {
  let called = false;
  const server = await start(createTrendsRouter({
    authenticate,
    aiRateLimit: (_req, _res, next) => next(),
    analyzeTrendContent: async () => {
      called = true;
      throw new Error("must not run for invalid input");
    },
  }));

  try {
    const response = await fetch(`${server.url}/detail`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Video", platform: "youtube", views: "not-a-number" }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json() as { code: string }).code, "INVALID_INPUT");
    assert.equal(called, false);
  } finally {
    await server.close();
  }
});

test("paid AI routes enforce the shared per-user request limit", async () => {
  const server = await start(createTrendsRouter({
    authenticate,
    aiRateLimit: aiLimiter,
    analyzeTrendContent: async () => ({
      openingHook: "A cautious inference",
      structure: ["Step one", "Step two", "Step three"],
      whyItMayWork: ["Reason one", "Reason two"],
      adaptationAngle: "Adapt with care",
      evidenceNote: "Inference based on one video's title and description.",
    }),
  }));

  try {
    const sendRequest = () => fetch(`${server.url}/detail`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Video", platform: "youtube" }),
    });
    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(await sendRequest());
    }
    assert.deepEqual(responses.slice(0, 5).map((response) => response.status), [200, 200, 200, 200, 200]);
    assert.equal(responses[5].status, 429);
    assert.equal((await responses[5].json() as { code: string }).code, "AI_RATE_LIMITED");
  } finally {
    await server.close();
  }
});
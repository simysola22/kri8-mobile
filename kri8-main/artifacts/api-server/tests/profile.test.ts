import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import {
  createPublicProfileRouter,
  type PublicProfileRepository,
} from "../src/routes/profile.js";

const serverApp = express();
const repository: PublicProfileRepository = {
  async findUser(username) {
    if (username === "missing") return null;
    return {
      id: 7,
      name: "Public Creator",
      username,
      bio: "A public bio",
      avatarUrl: null,
      isPublic: username !== "private",
      email: "must-not-leak@example.test",
      clerkUserId: "private-auth-id",
      themePreference: "private-theme",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
  },
  async listIdeas() {
    return {
      ideas: [{
        id: 31,
        title: "Public idea",
        insight: "Public insight",
        isUsed: false,
        userId: 7,
        notes: "private notes",
        videoEditingNotes: "private editing notes",
        customDate: "2025-01-01",
        usedDate: "2025-01-02",
        parentIdeaId: 30,
        branchCount: 4,
        createdDate: "2025-01-03",
        createdAt: new Date("2025-01-03T00:00:00.000Z"),
        updatedAt: new Date("2025-01-04T00:00:00.000Z"),
        branchMetadata: { internal: true },
      } as unknown as Awaited<ReturnType<PublicProfileRepository["listIdeas"]>>["ideas"][number]],
      nextCursor: null,
    };
  },
};

serverApp.use("/api/profile", createPublicProfileRouter(repository));
let server: ReturnType<typeof serverApp.listen>;
let baseUrl: string;

before(async () => {
  server = serverApp.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api/profile`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()),
  );
});

test("public profile and ideas are available without authentication and expose only public DTO fields", async () => {
  const response = await fetch(`${baseUrl}/alice`);
  assert.equal(response.status, 200);
  const payload = await response.json() as {
    user: Record<string, unknown>;
    ideas: Array<Record<string, unknown>>;
  };

  assert.deepEqual(payload.user, {
    id: 7,
    name: "Public Creator",
    username: "alice",
    bio: "A public bio",
    avatarUrl: null,
  });
  assert.deepEqual(Object.keys(payload.ideas[0]).sort(), [
    "id",
    "insight",
    "isUsed",
    "title",
  ]);
  for (const privateField of [
    "userId",
    "notes",
    "videoEditingNotes",
    "customDate",
    "usedDate",
    "parentIdeaId",
    "createdDate",
    "createdAt",
    "updatedAt",
    "branchCount",
    "branchMetadata",
  ]) {
    assert.equal(privateField in payload.ideas[0], false, `${privateField} leaked`);
  }
  for (const privateField of ["email", "clerkUserId", "themePreference", "createdAt"]) {
    assert.equal(privateField in payload.user, false, `${privateField} leaked`);
  }
});

test("private profiles are rejected", async () => {
  const response = await fetch(`${baseUrl}/private`);
  assert.equal(response.status, 404);
  assert.equal((await response.json() as { code: string }).code, "PROFILE_PRIVATE");
});

test("nonexistent profiles return not found", async () => {
  const response = await fetch(`${baseUrl}/missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json() as { code: string }).code, "PROFILE_NOT_FOUND");
});
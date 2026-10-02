import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express, { type Request, type RequestHandler } from "express";
import type { AddressInfo } from "node:net";
import { PgDialect, type SQL } from "drizzle-orm/pg-core";
import { createIdeasRouter } from "../src/routes/ideas.js";
import { createSocialRouter } from "../src/routes/social.js";
import type { db } from "@workspace/db";

const testClerkId = "test-clerk-user";
const authenticate: RequestHandler = (req, _res, next) => {
  (req as Request & { clerkUserId?: string }).clerkUserId = testClerkId;
  next();
};

function makeApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use((req: Request & { log?: { error: () => void } }, _res, next) => {
    req.log = { error: () => undefined };
    next();
  });
  app.use(router);
  return app;
}

async function start(app: express.Express) {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    ),
  };
}

function querySql(value: SQL) {
  return new PgDialect().sqlToQuery(value);
}

function fakeSelectDatabase(
  rows: unknown[][],
  options: {
    onWhere?: (condition: SQL) => void;
    onExecute?: (query: SQL) => { rows: unknown[] };
    onUpdate?: () => void;
    onInsert?: () => void;
  } = {},
) {
  let call = 0;
  const fake = {
    select() {
      return {
        from() {
          return {
            where(condition: SQL) {
              options.onWhere?.(condition);
              return {
                limit: async () => rows[call++] ?? [],
              };
            },
          };
        },
      };
    },
    execute: async (query: SQL) => options.onExecute?.(query) ?? { rows: [] },
    update() {
      options.onUpdate?.();
      return {
        set() {
          return {
            where() {
              return {
                returning: async () => [],
              };
            },
          };
        },
      };
    },
    insert() {
      options.onInsert?.();
      return {
        values() {
          return {
            returning: async () => [],
          };
        },
      };
    },
  };
  return fake as unknown as typeof db;
}

const getTestUser = async () => ({ id: 42 }) as Awaited<ReturnType<typeof import("../src/routes/users.js").getOrCreateUser>>;

test("cross-user idea reads are rejected and the SQL ownership condition is present", async () => {
  let where: SQL | undefined;
  const database = fakeSelectDatabase([[]], {
    onWhere: (condition) => { where = condition; },
  });
  const router = createIdeasRouter({ database, authenticate, getUser: getTestUser });
  const server = await start(makeApp(router));

  try {
    const response = await fetch(`${server.url}/99`);
    assert.equal(response.status, 404);
    assert.equal((await response.json() as { error: string }).error, "Idea not found");
    assert.ok(where);
    const query = querySql(where);
    assert.match(query.sql, /ideas"\."user_id"/);
    assert.ok(query.params.includes(42));
  } finally {
    await server.close();
  }
});

test("branch reads exclude rows owned by another user, including recursive branches", async () => {
  let branchQuery: SQL | undefined;
  const database = fakeSelectDatabase([[{ id: 77 }]], {
    onExecute: (query) => {
      branchQuery = query;
      return {
        rows: [
          {
            id: 78, user_id: 42, title: "Owned branch", insight: null, origin: null,
            notes: "private", video_editing_notes: null, created_date: "2025-01-01",
            used_date: null, custom_date: null, is_used: false, parent_idea_id: 77,
            branch_count: 0, created_at: new Date("2025-01-01T00:00:00.000Z"),
            updated_at: new Date("2025-01-01T00:00:00.000Z"),
          },
          {
            id: 79, user_id: 13, title: "Foreign branch", insight: "must not leak",
            origin: null, notes: "foreign", video_editing_notes: null,
            created_date: "2025-01-01", used_date: null, custom_date: null,
            is_used: false, parent_idea_id: 78, branch_count: 0,
            created_at: new Date("2025-01-01T00:00:00.000Z"),
            updated_at: new Date("2025-01-01T00:00:00.000Z"),
          },
        ],
      };
    },
  });
  const server = await start(makeApp(createIdeasRouter({
    database,
    authenticate,
    getUser: getTestUser,
  })));

  try {
    const response = await fetch(`${server.url}/77/branches`);
    assert.equal(response.status, 200);
    const branches = await response.json() as Array<{ id: number; userId: number }>;
    assert.deepEqual(branches.map((branch) => branch.id), [78]);
    assert.equal(branches[0].userId, 42);
    assert.ok(branchQuery);
    const query = querySql(branchQuery);
    assert.equal((query.sql.match(/user_id/g) ?? []).length, 2);
    assert.deepEqual(query.params, [77, 42, 42]);
  } finally {
    await server.close();
  }
});

test("an owner check also protects idea updates from cross-user writes", async () => {
  let updateCalled = false;
  const database = fakeSelectDatabase([[]], {
    onUpdate: () => { updateCalled = true; },
  });
  const server = await start(makeApp(createIdeasRouter({
    database,
    authenticate,
    getUser: getTestUser,
  })));

  try {
    const response = await fetch(`${server.url}/99`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Unauthorized edit" }),
    });
    assert.equal(response.status, 404);
    assert.equal(updateCalled, false);
  } finally {
    await server.close();
  }
});

test("cross-user idea deletion never reaches the recursive delete", async () => {
  let deleteCalled = false;
  const database = fakeSelectDatabase([[]], {
    onExecute: () => {
      deleteCalled = true;
      return { rows: [] };
    },
  });
  const server = await start(makeApp(createIdeasRouter({
    database,
    authenticate,
    getUser: getTestUser,
  })));

  try {
    const response = await fetch(`${server.url}/99`, { method: "DELETE" });
    assert.equal(response.status, 404);
    assert.equal(deleteCalled, false);
  } finally {
    await server.close();
  }
});

test("a branch cannot be created under another user's idea", async () => {
  let insertCalled = false;
  const database = fakeSelectDatabase([[]], {
    onInsert: () => { insertCalled = true; },
  });
  const server = await start(makeApp(createIdeasRouter({
    database,
    authenticate,
    getUser: getTestUser,
  })));

  try {
    const response = await fetch(`${server.url}/99/branches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Unauthorized branch" }),
    });
    assert.equal(response.status, 404);
    assert.equal(insertCalled, false);
  } finally {
    await server.close();
  }
});

test("messages cannot be read or sent without an accepted friendship", async () => {
  let insertCalled = false;
  let authCalls = 0;
  const testAuth: RequestHandler = (req, res, next) => {
    authCalls += 1;
    authenticate(req, res, next);
  };
  const database = fakeSelectDatabase([
    [{ id: 42, clerkUserId: testClerkId, isPublic: true }],
    [],
    [{ id: 42, clerkUserId: testClerkId, isPublic: true }],
    [],
  ], {
    onInsert: () => { insertCalled = true; },
  });
  const server = await start(makeApp(createSocialRouter({ database, authenticate: testAuth })));

  try {
    const readResponse = await fetch(`${server.url}/messages/13`);
    assert.equal(readResponse.status, 403, await readResponse.text());
    const sendResponse = await fetch(`${server.url}/messages/13`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    });
    assert.equal(sendResponse.status, 403);
    assert.equal(insertCalled, false);
    assert.equal(authCalls, 2);
  } finally {
    await server.close();
  }
});

test("only a pending friend request addressed to the caller can be answered", async () => {
  let updateCalled = false;
  const database = fakeSelectDatabase([
    [{ id: 42, clerkUserId: testClerkId, isPublic: true }],
    [],
  ], {
    onUpdate: () => { updateCalled = true; },
  });
  const server = await start(makeApp(createSocialRouter({ database, authenticate })));

  try {
    const response = await fetch(`${server.url}/friends/55/respond`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    assert.equal(response.status, 404);
    assert.equal(updateCalled, false);
  } finally {
    await server.close();
  }
});
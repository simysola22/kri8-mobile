import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or, ilike, ne, and } from "drizzle-orm";
import { isDevMode } from "../middlewares/devAuthMiddleware";

const router = Router();
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

function normalizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function usernameValidationError(username: string): string | null {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 30) return "Username must be 30 characters or fewer";
  if (!USERNAME_PATTERN.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return null;
}

function safeGetAuth(req: any): { userId: string | null; sessionClaims: Record<string, unknown> } {
  if (isDevMode) return { userId: null, sessionClaims: {} };
  try {
    const { getAuth } = require("@clerk/express") as typeof import("@clerk/express");
    const auth = getAuth(req);
    return { userId: auth?.userId ?? null, sessionClaims: (auth?.sessionClaims ?? {}) as Record<string, unknown> };
  } catch {
    return { userId: null, sessionClaims: {} };
  }
}

export const requireAuth = (req: any, res: any, next: any) => {
  const { userId } = safeGetAuth(req);
  const devUserId: string | undefined = req.__devUserId;
  const effective = userId || devUserId || null;
  if (!effective) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = effective;
  next();
};

async function getOrCreateUser(
  clerkUserId: string,
  email: string,
  name?: string,
) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkUserId, email: email || "", name: name || null })
    .returning();

  return newUser;
}

export { getOrCreateUser };

// GET /api/users/me
router.get("/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId: string = req.clerkUserId;
    const { sessionClaims } = safeGetAuth(req);
    const email = (sessionClaims?.email as string) || "";
    const name = (sessionClaims?.name as string) || undefined;

    const user = await getOrCreateUser(clerkUserId, email, name);

    res.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
      themePreference: user.themePreference,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me
router.patch("/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId: string = req.clerkUserId;
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, username, themePreference, bio, avatarUrl, isPublic } = req.body;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) {
      const normalizedUsername = normalizeUsername(username);
      const validationError = usernameValidationError(normalizedUsername);
      if (validationError) {
        res.status(400).json({ error: validationError, code: "INVALID_USERNAME" });
        return;
      }

      const duplicate = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.username, normalizedUsername),
            ne(usersTable.id, existing[0].id),
          ),
        )
        .limit(1);
      if (duplicate.length > 0) {
        res.status(409).json({ error: "That username is already taken", code: "USERNAME_TAKEN" });
        return;
      }
      updates.username = normalizedUsername;
    }
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (themePreference !== undefined) updates.themePreference = themePreference;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .returning();

    res.json({
      id: updated.id,
      clerkUserId: updated.clerkUserId,
      email: updated.email,
      name: updated.name,
      username: updated.username,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      isPublic: updated.isPublic,
      themePreference: updated.themePreference,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "That username is already taken", code: "USERNAME_TAKEN" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/username-availability?username=
router.get("/username-availability", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const username = normalizeUsername(req.query.username);
    const validationError = usernameValidationError(username);
    if (validationError) {
      res.json({ available: false, username, reason: validationError });
      return;
    }

    const clerkUserId: string = req.clerkUserId;
    const meRows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    const matches = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.username, username),
          meRows[0] ? ne(usersTable.id, meRows[0].id) : undefined,
        ),
      )
      .limit(1);

    res.json({
      available: matches.length === 0,
      username,
      ...(matches.length > 0 ? { reason: "That username is already taken" } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to check username availability");
    res.status(500).json({ error: "Could not check username availability" });
  }
});

// GET /api/users/search?q=
router.get("/search", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const clerkUserId: string = req.clerkUserId;
    const meRows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);
    const myId = meRows[0]?.id;

    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(
          or(
            ilike(usersTable.name, `%${q}%`),
            ilike(usersTable.username, `%${q}%`),
          ),
          myId !== undefined ? ne(usersTable.id, myId) : undefined,
        ),
      )
      .limit(20);

    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to search users");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;

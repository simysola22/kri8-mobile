import { Router, type Request, type Response } from "express";
import { db, usersTable, ideasTable } from "@workspace/db";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";

export interface PublicProfileUser {
  id: number;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface PublicIdea {
  id: number;
  title: string;
  insight: string | null;
  isUsed: boolean;
}

export interface PublicIdeaPage {
  user?: PublicProfileUser;
  ideas: PublicIdea[];
  nextCursor: number | null;
}

interface ProfileOwner extends PublicProfileUser {
  isPublic: boolean;
}

export interface PublicProfileRepository {
  findUser(username: string): Promise<ProfileOwner | null>;
  listIdeas(userId: number, cursor: number | undefined, limit: number): Promise<PublicIdeaPage>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const databaseRepository: PublicProfileRepository = {
  async findUser(username) {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        username: usersTable.username,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        isPublic: usersTable.isPublic,
      })
      .from(usersTable)
      .where(sql`lower(${usersTable.username}) = ${username}`)
      .limit(1);
    return rows[0] ?? null;
  },

  async listIdeas(userId, cursor, limit) {
    const conditions = [
      eq(ideasTable.userId, userId),
      isNull(ideasTable.parentIdeaId),
      ...(cursor === undefined ? [] : [lt(ideasTable.id, cursor)]),
    ];
    const rows = await db
      .select({
        id: ideasTable.id,
        title: ideasTable.title,
        insight: ideasTable.insight,
        isUsed: ideasTable.isUsed,
      })
      .from(ideasTable)
      .where(and(...conditions))
      .orderBy(desc(ideasTable.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const ideas = page.map((idea): PublicIdea => ({
      id: idea.id,
      title: idea.title,
      insight: idea.insight,
      isUsed: idea.isUsed,
    }));

    return {
      ideas,
      nextCursor: hasMore && page.length > 0 ? page[page.length - 1].id : null,
    };
  },
};

function parsePagination(query: Record<string, unknown>):
  | { ok: true; cursor: number | undefined; limit: number }
  | { ok: false } {
  const rawLimit = query.limit;
  const rawCursor = query.cursor;
  if (Array.isArray(rawLimit) || Array.isArray(rawCursor)) return { ok: false };

  let limit = DEFAULT_LIMIT;
  if (rawLimit !== undefined) {
    if (typeof rawLimit !== "string" || !/^[1-9]\d*$/.test(rawLimit)) return { ok: false };
    limit = Number(rawLimit);
    if (!Number.isSafeInteger(limit) || limit > MAX_LIMIT) return { ok: false };
  }

  let cursor: number | undefined;
  if (rawCursor !== undefined) {
    if (typeof rawCursor !== "string" || !/^[1-9]\d*$/.test(rawCursor)) return { ok: false };
    cursor = Number(rawCursor);
    if (!Number.isSafeInteger(cursor)) return { ok: false };
  }
  return { ok: true, cursor, limit };
}

function serializePublicUser(user: ProfileOwner): PublicProfileUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}

function serializePublicIdea(idea: PublicIdea): PublicIdea {
  return {
    id: idea.id,
    title: idea.title,
    insight: idea.insight,
    isUsed: idea.isUsed,
  };
}

function serializePublicIdeaPage(page: PublicIdeaPage): PublicIdeaPage {
  return {
    ideas: page.ideas.map(serializePublicIdea),
    nextCursor: page.nextCursor,
  };
}

export function createPublicProfileRouter(
  repository: PublicProfileRepository = databaseRepository,
) {
  const router = Router();

  async function resolvePublicUser(
    usernameParam: unknown,
    res: Response,
  ): Promise<ProfileOwner | null> {
    const username = typeof usernameParam === "string"
      ? usernameParam.trim().toLowerCase()
      : "";
    if (!USERNAME_PATTERN.test(username)) {
      res.status(404).json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" });
      return null;
    }

    const user = await repository.findUser(username);
    if (!user) {
      res.status(404).json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" });
      return null;
    }
    if (!user.isPublic) {
      res.status(404).json({ error: "This profile is private", code: "PROFILE_PRIVATE" });
      return null;
    }
    return user;
  }

  router.get("/:username/ideas", async (
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      if (!pagination.ok) {
        res.status(400).json({ error: "Invalid pagination parameters" });
        return;
      }
      const user = await resolvePublicUser(req.params.username, res);
      if (!user) return;
      res.json(serializePublicIdeaPage(
        await repository.listIdeas(user.id, pagination.cursor, pagination.limit),
      ));
    } catch (err) {
      req.log.error({ err }, "Failed to get public profile ideas");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/:username", async (
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      if (!pagination.ok) {
        res.status(400).json({ error: "Invalid pagination parameters" });
        return;
      }
      const user = await resolvePublicUser(req.params.username, res);
      if (!user) return;
      const page = await repository.listIdeas(user.id, pagination.cursor, pagination.limit);
      res.json({
        user: serializePublicUser(user),
        ...serializePublicIdeaPage(page),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to get public profile");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default createPublicProfileRouter();
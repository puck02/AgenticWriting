import type { Prisma, PrismaClient, User } from "@prisma/client";
import { cookies } from "next/headers";

const userCookieName = "agentic_writing_user";
const fallbackDemoEmail = "demo@agentic-writing.local";

type SessionDb = Pick<PrismaClient, "user">;

export function canAccessUserResource({
  currentUserId,
  resourceUserId
}: {
  currentUserId: string;
  resourceUserId: string;
}): boolean {
  return currentUserId === resourceUserId;
}

export async function getOrCreateCurrentUser(db: SessionDb): Promise<User> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(userCookieName)?.value;
  const existingUser = userId
    ? await db.user.findUnique({ where: { id: userId } })
    : null;

  if (existingUser) {
    return existingUser;
  }

  const user = await getOrCreateFallbackDemoUser(db);

  try {
    cookieStore.set(userCookieName, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  } catch {
    // Server Components cannot mutate cookies in production; route handlers still can.
  }

  return user;
}

async function getOrCreateFallbackDemoUser(db: SessionDb): Promise<User> {
  const existingUser = await db.user.findUnique({
    where: { email: fallbackDemoEmail }
  });

  if (existingUser) {
    return existingUser;
  }

  try {
    return await db.user.create({
      data: {
        email: fallbackDemoEmail
      } satisfies Prisma.UserCreateInput
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const concurrentUser = await db.user.findUnique({
      where: { email: fallbackDemoEmail }
    });

    if (!concurrentUser) {
      throw error;
    }

    return concurrentUser;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: unknown }).code === "P2002";
}

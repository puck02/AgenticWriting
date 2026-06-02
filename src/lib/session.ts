import type { Prisma, PrismaClient, User } from "@prisma/client";
import { cookies } from "next/headers";

const userCookieName = "agentic_writing_user";

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

  const user = await db.user.create({
    data: {
      email: createDemoUserEmail()
    } satisfies Prisma.UserCreateInput
  });

  cookieStore.set(userCookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return user;
}

function createDemoUserEmail(): string {
  return `demo-${crypto.randomUUID()}@agentic-writing.local`;
}

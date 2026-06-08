import type { PrismaClient, User, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hashOpaqueToken } from "@/lib/token";

export const sessionCookieName = "agentic_writing_session";
export const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

type SessionDb = Pick<PrismaClient, "authSession">;
type SessionUser = User;

export function canAccessUserResource({
  currentUserId,
  resourceUserId
}: {
  currentUserId: string;
  resourceUserId: string;
}): boolean {
  return currentUserId === resourceUserId;
}

export async function getCurrentUser(db: SessionDb): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.authSession.findUnique({
    where: { tokenHash: hashOpaqueToken(sessionToken) },
    include: { user: true }
  });

  if (!session) {
    safelyDeleteSessionCookie(cookieStore);
    return null;
  }

  if (session.expiresAt <= new Date()) {
    safelyDeleteSessionCookie(cookieStore);
    return null;
  }

  return session.user;
}

export async function requireCurrentUser(db: SessionDb): Promise<SessionUser> {
  const user = await getCurrentUser(db);

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function isAdminUser(user: Pick<SessionUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}

export function createSessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + sessionDurationMs);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  safelyDeleteSessionCookie(cookieStore);
}

function safelyDeleteSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  try {
    cookieStore.delete(sessionCookieName);
  } catch {
    // Server Components cannot mutate cookies in production.
  }
}

export function normalizeUserRole(role: UserRole): UserRole {
  return role;
}

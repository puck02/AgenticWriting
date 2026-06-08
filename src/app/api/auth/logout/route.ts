import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { clearSessionCookie, sessionCookieName } from "@/lib/session";
import { deleteLoginSession } from "@/services/auth/auth-service";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  if (sessionToken) {
    await deleteLoginSession(db, sessionToken);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}

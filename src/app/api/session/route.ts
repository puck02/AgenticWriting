import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getOrCreateCurrentUser(db);

  return NextResponse.json({ userId: user.id });
}

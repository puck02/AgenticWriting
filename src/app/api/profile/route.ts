import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getOrCreateCurrentUser(db);
  const [preferences, errorPatterns] = await Promise.all([
    db.writingPreference.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" }
    }),
    db.errorPattern.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return NextResponse.json({ preferences, errorPatterns });
}

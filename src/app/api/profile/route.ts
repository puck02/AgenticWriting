import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser(db);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

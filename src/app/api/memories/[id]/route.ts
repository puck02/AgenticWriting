import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser(db);
  const deletedPreference = await db.writingPreference.updateMany({
    where: { id, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() }
  });

  if (deletedPreference.count > 0) {
    return NextResponse.json({ ok: true });
  }

  const deletedPattern = await db.errorPattern.updateMany({
    where: { id, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() }
  });

  if (deletedPattern.count > 0) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Memory not found" }, { status: 404 });
}

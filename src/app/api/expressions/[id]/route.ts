import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(db);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedExpression = await db.expressionAsset.updateMany({
    where: { id, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() }
  });

  if (deletedExpression.count === 0) {
    return NextResponse.json({ error: "Expression not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

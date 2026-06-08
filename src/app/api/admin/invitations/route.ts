import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";
import { AuthError, createInvitationCode } from "@/services/auth/auth-service";

export async function GET() {
  const user = await getCurrentUser(db);

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await db.invitationCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      usedBy: {
        select: {
          email: true
        }
      }
    }
  });

  return NextResponse.json({
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      codePreview: invitation.codePreview,
      usedAt: invitation.usedAt,
      usedByEmail: invitation.usedBy?.email ?? null,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    }))
  });
}

export async function POST() {
  const user = await getCurrentUser(db);

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminUser = {
    id: user.id,
    role: user.role
  };

  try {
    const { code, invitation } = await createInvitationCode(db, adminUser);

    return NextResponse.json({
      code,
      invitation: {
        id: invitation.id,
        codePreview: invitation.codePreview,
        usedAt: invitation.usedAt,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "邀请码生成失败。" }, { status: 500 });
  }
}

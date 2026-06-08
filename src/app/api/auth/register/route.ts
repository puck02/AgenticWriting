import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { AuthError, registerUserWithInvite } from "@/services/auth/auth-service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "请输入有效邮箱、至少 8 位密码和邀请码。" },
      { status: 400 }
    );
  }

  try {
    const { user, sessionToken, expiresAt } = await registerUserWithInvite(
      db,
      parsedBody.data
    );

    await setSessionCookie(sessionToken, expiresAt);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "注册失败，请稍后重试。" }, { status: 500 });
  }
}

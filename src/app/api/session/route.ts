import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser(db);

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role
        }
      : null
  });
}

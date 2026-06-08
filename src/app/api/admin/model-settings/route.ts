import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { reviewModels } from "@/domain/models";
import { db } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";
import {
  getPublicModelSettings,
  saveModelSettings
} from "@/services/ai/model-settings-service";

const reviewModelValues = reviewModels.map((model) => model.value) as [
  (typeof reviewModels)[number]["value"],
  ...(typeof reviewModels)[number]["value"][]
];

const modelSettingsSchema = z.object({
  baseUrl: z.string().min(1),
  apiKey: z.string(),
  defaultModel: z.enum(reviewModelValues)
});

export async function GET() {
  const user = await getCurrentUser(db);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    settings: await getPublicModelSettings({ db })
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(db);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = modelSettingsSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "模型设置格式不正确。" }, { status: 400 });
  }

  try {
    await saveModelSettings(db, parsedBody.data);

    return NextResponse.json({
      settings: await getPublicModelSettings({ db })
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "模型设置保存失败。"
      },
      { status: 400 }
    );
  }
}

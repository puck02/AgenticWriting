import type { ErrorPattern, ExpressionAsset, WritingPreference } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { essayTypes } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import { reviewModels } from "@/domain/models";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  getEffectiveModelSettings,
  normalizeReviewModel
} from "@/services/ai/model-settings-service";
import { generateWritingHint } from "@/services/guidance/guidance-service";
import { FetchModelProvider } from "@/services/review/model-provider";

const essayTypeValues = essayTypes.map((essayType) => essayType.value) as [
  (typeof essayTypes)[number]["value"],
  ...(typeof essayTypes)[number]["value"][]
];
const reviewModelValues = reviewModels.map((model) => model.value) as [
  (typeof reviewModels)[number]["value"],
  ...(typeof reviewModels)[number]["value"][]
];

const hintRequestSchema = z.object({
  essayType: z.enum(essayTypeValues),
  prompt: z.string().min(1),
  draft: z.string().min(1),
  reviewModel: z.enum(reviewModelValues).optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedBody = hintRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid hint payload" }, { status: 400 });
  }

  const user = await getCurrentUser(db);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modelSettings = await getEffectiveModelSettings(db);
  const model = normalizeReviewModel(
    parsedBody.data.reviewModel ?? modelSettings?.defaultModel
  );
  const baseUrl = modelSettings?.baseUrl ?? process.env.MODEL_API_BASE_URL;
  const apiKey = modelSettings?.apiKey ?? process.env.MODEL_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "模型设置未完成。" }, { status: 400 });
  }

  const memory = await loadMemory(user.id);
  const hint = await generateWritingHint({
    provider: new FetchModelProvider({ baseUrl, apiKey, model }),
    essayType: parsedBody.data.essayType,
    prompt: parsedBody.data.prompt,
    draft: parsedBody.data.draft,
    memory
  });

  return NextResponse.json({ hint });
}

async function loadMemory(userId: string): Promise<MemorySnapshot> {
  const [preferences, errorPatterns, expressions] = await Promise.all([
    db.writingPreference.findMany({
      where: { userId, deletedAt: null }
    }),
    db.errorPattern.findMany({
      where: { userId, deletedAt: null }
    }),
    db.expressionAsset.findMany({
      where: { userId, deletedAt: null }
    })
  ]);

  return {
    preferences: preferences.map(mapPreference),
    errorPatterns: errorPatterns.map(mapErrorPattern),
    expressions: expressions.map(mapExpression)
  };
}

function mapPreference(preference: WritingPreference): MemorySnapshot["preferences"][number] {
  return {
    id: preference.id,
    label: preference.label,
    acceptCount: preference.acceptCount,
    rejectCount: preference.rejectCount,
    essayType: preference.essayType
  };
}

function mapErrorPattern(pattern: ErrorPattern): MemorySnapshot["errorPatterns"][number] {
  return {
    id: pattern.id,
    label: pattern.label,
    count: pattern.count,
    essayType: pattern.essayType
  };
}

function mapExpression(expression: ExpressionAsset): MemorySnapshot["expressions"][number] {
  return {
    id: expression.id,
    essayType: expression.essayType,
    topic: expression.topic,
    expressionIntent: expression.expressionIntent,
    optimizedSentence: expression.optimizedSentence,
    reuseCount: expression.reuseCount
  };
}

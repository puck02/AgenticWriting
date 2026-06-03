import type { WritingPreference, ErrorPattern, ExpressionAsset } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { essayTypes } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";
import { saveReviewedEssay } from "@/services/essay/essay-service";
import { createReviewerFromEnv } from "@/services/review/reviewer-factory";
import { reviewEssayDraft } from "@/services/review/review-service";

const essayTypeValues = essayTypes.map((essayType) => essayType.value) as [
  (typeof essayTypes)[number]["value"],
  ...(typeof essayTypes)[number]["value"][]
];

const createEssaySchema = z.object({
  essayType: z.enum(essayTypeValues),
  prompt: z.string().min(1),
  content: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedBody = createEssaySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid essay payload" }, { status: 400 });
  }

  const user = await getOrCreateCurrentUser(db);
  const { essayType, prompt, content } = parsedBody.data;
  const memory = await loadMemory(user.id);
  const review = await reviewEssayDraft({
    reviewer: createReviewerFromEnv(),
    essayType,
    prompt,
    content,
    memory
  });
  const essay = await saveReviewedEssay({
    db,
    userId: user.id,
    essayType,
    prompt,
    content,
    review
  });

  return NextResponse.json({ essayId: essay.id });
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

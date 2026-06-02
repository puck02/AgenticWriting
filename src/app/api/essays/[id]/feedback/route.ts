import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { rejectLabels } from "@/domain/labels";
import { db } from "@/lib/db";
import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";

const rejectLabelValues = rejectLabels.map((rejectLabel) => rejectLabel.value) as [
  (typeof rejectLabels)[number]["value"],
  ...(typeof rejectLabels)[number]["value"][]
];

const feedbackSchema = z
  .object({
    suggestionId: z.string().min(1),
    accepted: z.boolean(),
    rejectLabel: z.enum(rejectLabelValues).optional()
  })
  .refine((value) => value.accepted || value.rejectLabel, {
    message: "rejectLabel is required when accepted is false",
    path: ["rejectLabel"]
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: essayId } = await params;
  const body = await request.json().catch(() => null);
  const parsedBody = feedbackSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const user = await getOrCreateCurrentUser(db);
  const { suggestionId, accepted, rejectLabel } = parsedBody.data;
  const suggestion = await db.reviewSuggestion.findUnique({
    where: { id: suggestionId },
    include: { essay: true }
  });

  if (!suggestion || suggestion.essayId !== essayId) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (
    !canAccessUserResource({
      currentUserId: user.id,
      resourceUserId: suggestion.essay.userId
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.$transaction(async (tx) => {
    await tx.reviewSuggestion.update({
      where: { id: suggestionId },
      data: {
        accepted,
        rejectLabel: accepted ? null : rejectLabel
      }
    });

    if (accepted) {
      await tx.expressionAsset.create({
        data: {
          userId: user.id,
          essayType: suggestion.essay.type,
          topic: suggestion.topic,
          expressionIntent: suggestion.expressionIntent,
          originalSentence: suggestion.originalSentence,
          optimizedSentence: suggestion.suggestedSentence
        }
      });
    }
  });

  return NextResponse.json({ ok: true });
}

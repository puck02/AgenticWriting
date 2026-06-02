import type { EssayTypeValue, RejectLabelValue } from "@/domain/labels";

type FeedbackSuggestion = {
  id: string;
  topic: string;
  preferenceLabel: string;
  expressionIntent: string;
  originalSentence: string;
  suggestedSentence: string;
};

type FeedbackTransaction = {
  reviewSuggestion: {
    updateMany(args: {
      where: {
        id: string;
        OR: [{ accepted: null }, { accepted: boolean }];
      };
      data: { accepted: boolean; rejectLabel: RejectLabelValue | null };
    }): Promise<{ count: number }>;
    update(args: {
      where: { id: string };
      data: { accepted: boolean; rejectLabel: RejectLabelValue | null };
    }): Promise<unknown>;
  };
  expressionAsset: {
    findFirst(args: {
      where: {
        userId: string;
        essayType: EssayTypeValue;
        topic: string;
        expressionIntent: string;
        originalSentence: string;
        optimizedSentence: string;
        deletedAt: null;
      };
    }): Promise<unknown>;
    create(args: {
      data: {
        userId: string;
        essayType: EssayTypeValue;
        topic: string;
        expressionIntent: string;
        originalSentence: string;
        optimizedSentence: string;
      };
    }): Promise<unknown>;
  };
  writingPreference: {
    upsert(args: {
      where: {
        userId_label_essayType: {
          userId: string;
          label: string;
          essayType: EssayTypeValue;
        };
      };
      create: {
        userId: string;
        label: string;
        essayType: EssayTypeValue;
        acceptCount: number;
        rejectCount: number;
      };
      update:
        | { acceptCount: { increment: number }; deletedAt: null }
        | { rejectCount: { increment: number }; deletedAt: null };
    }): Promise<unknown>;
  };
  memoryEvent: {
    create(args: {
      data: {
        userId: string;
        eventType: "SUGGESTION_ACCEPTED" | "SUGGESTION_REJECTED";
        suggestionId: string;
        essayType: EssayTypeValue;
        label: string;
        payload: {
          topic: string;
          expressionIntent: string;
          originalSentence: string;
          suggestedSentence: string;
          rejectLabel: RejectLabelValue | null;
        };
      };
    }): Promise<unknown>;
  };
};

type FeedbackDb = {
  $transaction<Result>(
    callback: (tx: FeedbackTransaction) => Promise<Result>
  ): Promise<Result>;
};

export async function recordSuggestionResponse({
  db,
  userId,
  essayType,
  suggestion,
  accepted,
  rejectLabel
}: {
  db: FeedbackDb;
  userId: string;
  essayType: EssayTypeValue;
  suggestion: FeedbackSuggestion;
  accepted: boolean;
  rejectLabel?: RejectLabelValue;
}) {
  if (!accepted && !rejectLabel) {
    throw new Error("rejectLabel is required when accepted is false");
  }

  return db.$transaction(async (tx) => {
    const stateChange = await tx.reviewSuggestion.updateMany({
      where: {
        id: suggestion.id,
        OR: [{ accepted: null }, { accepted: !accepted }]
      },
      data: {
        accepted,
        rejectLabel: accepted ? null : (rejectLabel ?? null)
      }
    });

    if (stateChange.count === 0) {
      await tx.reviewSuggestion.update({
        where: { id: suggestion.id },
        data: {
          accepted,
          rejectLabel: accepted ? null : (rejectLabel ?? null)
        }
      });
      return;
    }

    await tx.writingPreference.upsert({
      where: {
        userId_label_essayType: {
          userId,
          label: suggestion.preferenceLabel,
          essayType
        }
      },
      create: {
        userId,
        label: suggestion.preferenceLabel,
        essayType,
        acceptCount: accepted ? 1 : 0,
        rejectCount: accepted ? 0 : 1
      },
      update: accepted
        ? {
            acceptCount: { increment: 1 },
            deletedAt: null
          }
        : {
            rejectCount: { increment: 1 },
            deletedAt: null
          }
    });

    await tx.memoryEvent.create({
      data: {
        userId,
        eventType: accepted ? "SUGGESTION_ACCEPTED" : "SUGGESTION_REJECTED",
        suggestionId: suggestion.id,
        essayType,
        label: suggestion.preferenceLabel,
        payload: {
          topic: suggestion.topic,
          expressionIntent: suggestion.expressionIntent,
          originalSentence: suggestion.originalSentence,
          suggestedSentence: suggestion.suggestedSentence,
          rejectLabel: accepted ? null : (rejectLabel ?? null)
        }
      }
    });

    if (!accepted) {
      return;
    }

    const existingExpression = await tx.expressionAsset.findFirst({
      where: {
        userId,
        essayType,
        topic: suggestion.topic,
        expressionIntent: suggestion.expressionIntent,
        originalSentence: suggestion.originalSentence,
        optimizedSentence: suggestion.suggestedSentence,
        deletedAt: null
      }
    });

    if (existingExpression) {
      return;
    }

    await tx.expressionAsset.create({
      data: {
        userId,
        essayType,
        topic: suggestion.topic,
        expressionIntent: suggestion.expressionIntent,
        originalSentence: suggestion.originalSentence,
        optimizedSentence: suggestion.suggestedSentence
      }
    });
  });
}

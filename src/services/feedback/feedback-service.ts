import type { EssayTypeValue, RejectLabelValue } from "@/domain/labels";

type FeedbackSuggestion = {
  id: string;
  topic: string;
  preferenceLabel: string;
  expressionIntent: string;
  originalSentence: string;
  suggestedSentence: string;
  accepted: boolean | null;
};

type FeedbackTransaction = {
  reviewSuggestion: {
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
        | { acceptCount: { increment: number } }
        | { rejectCount: { increment: number } };
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
    await tx.reviewSuggestion.update({
      where: { id: suggestion.id },
      data: {
        accepted,
        rejectLabel: accepted ? null : (rejectLabel ?? null)
      }
    });

    if (suggestion.accepted !== accepted) {
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
          ? { acceptCount: { increment: 1 } }
          : { rejectCount: { increment: 1 } }
      });
    }

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

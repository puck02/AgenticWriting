import type { EssayTypeValue, RejectLabelValue } from "@/domain/labels";

type FeedbackSuggestion = {
  id: string;
  topic: string;
  expressionIntent: string;
  originalSentence: string;
  suggestedSentence: string;
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
  return db.$transaction(async (tx) => {
    await tx.reviewSuggestion.update({
      where: { id: suggestion.id },
      data: {
        accepted,
        rejectLabel: accepted ? null : (rejectLabel ?? null)
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

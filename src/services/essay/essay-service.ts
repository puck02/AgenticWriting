import type { Prisma } from "@prisma/client";

import type { EssayTypeValue } from "@/domain/labels";
import type { ReviewResult } from "@/domain/review-schema";

type EssayDb<EssayResult> = {
  essay: {
    create(args: Prisma.EssayCreateArgs): Promise<EssayResult>;
  };
  errorPattern: {
    upsert(args: Prisma.ErrorPatternUpsertArgs): Promise<unknown>;
  };
  uploadAsset: {
    updateMany(args: Prisma.UploadAssetUpdateManyArgs): Promise<unknown>;
  };
  $transaction<Result>(
    callback: (tx: EssayTransactionDb<EssayResult>) => Promise<Result>
  ): Promise<Result>;
};

type EssayTransactionDb<EssayResult> = {
  essay: {
    create(args: Prisma.EssayCreateArgs): Promise<EssayResult>;
  };
  errorPattern: {
    upsert(args: Prisma.ErrorPatternUpsertArgs): Promise<unknown>;
  };
  uploadAsset: {
    updateMany(args: Prisma.UploadAssetUpdateManyArgs): Promise<unknown>;
  };
};

export async function saveReviewedEssay<EssayResult extends { id: string }>({
  db,
  userId,
  essayType,
  prompt,
  content,
  uploadAssetIds = [],
  review
}: {
  db: EssayDb<EssayResult>;
  userId: string;
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  uploadAssetIds?: string[];
  review: ReviewResult;
}): Promise<EssayResult> {
  return db.$transaction(async (tx) => {
    const essay = await tx.essay.create({
      data: {
        userId,
        type: essayType,
        prompt,
        content,
        overallScore: review.overallScore,
        reviewSummary: review.summary,
        suggestions: {
          create: review.suggestions.map((suggestion) => ({
            originalSentence: suggestion.originalSentence,
            suggestedSentence: suggestion.suggestedSentence,
            reason: suggestion.reason,
            preferenceLabel: suggestion.preferenceLabel,
            expressionIntent: suggestion.expressionIntent,
            topic: suggestion.topic,
            profileExplanation: suggestion.profileExplanation
          }))
        }
      },
      include: {
        suggestions: true
      }
    });

    const uniqueUploadAssetIds = Array.from(new Set(uploadAssetIds));

    if (uniqueUploadAssetIds.length > 0) {
      await tx.uploadAsset.updateMany({
        where: {
          id: { in: uniqueUploadAssetIds },
          userId,
          essayId: null
        },
        data: {
          essayId: essay.id
        }
      });
    }

    await Promise.all(
      review.errorPatterns.map((label) =>
        tx.errorPattern.upsert({
          where: {
            userId_label_essayType: {
              userId,
              label,
              essayType
            }
          },
          create: {
            userId,
            label,
            essayType,
            count: 1
          },
          update: {
            count: {
              increment: 1
            },
            deletedAt: null
          }
        })
      )
    );

    return essay;
  });
}

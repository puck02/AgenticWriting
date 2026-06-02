import { describe, expect, it, vi } from "vitest";

import type { MemorySnapshot } from "@/domain/memory";
import type { ReviewResult } from "@/domain/review-schema";
import type { LlmReviewer } from "@/services/review/llm-reviewer";
import { reviewEssayDraft } from "@/services/review/review-service";
import { saveReviewedEssay } from "@/services/essay/essay-service";

const validReview: ReviewResult = {
  overallScore: 16,
  summary: "文章结构完整，表达清晰。",
  priority: "优先补充更具体的论据。",
  categoryScores: {
    content: 4,
    accuracy: 4,
    richness: 4,
    coherence: 4
  },
  errorPatterns: ["论据略泛"],
  suggestions: [
    {
      originalSentence: "People should read more books.",
      suggestedSentence:
        "People can build stronger judgment by reading more books.",
      reason: "表达更具体。",
      expressionIntent: "说明阅读价值",
      topic: "reading",
      preferenceLabel: "正式但自然",
      profileExplanation: "符合用户偏好的正式表达。"
    }
  ]
};

const memory: MemorySnapshot = {
  preferences: [
    {
      id: "preference-other",
      label: "不同题型偏好",
      essayType: "ENGLISH_TWO_CHART",
      acceptCount: 2,
      rejectCount: 0
    },
    {
      id: "preference-same",
      label: "同题型偏好",
      essayType: "ENGLISH_ONE_PICTURE",
      acceptCount: 1,
      rejectCount: 0
    }
  ],
  errorPatterns: [
    {
      id: "error-other",
      label: "不同题型错误",
      essayType: "ENGLISH_TWO_CHART",
      count: 2
    },
    {
      id: "error-same",
      label: "同题型错误",
      essayType: "ENGLISH_ONE_PICTURE",
      count: 1
    }
  ],
  expressions: [
    {
      id: "expression-other",
      essayType: "ENGLISH_TWO_CHART",
      topic: "work",
      expressionIntent: "compare",
      optimizedSentence: "The figures differ sharply.",
      reuseCount: 1
    },
    {
      id: "expression-same",
      essayType: "ENGLISH_ONE_PICTURE",
      topic: "reading",
      expressionIntent: "explain benefit",
      optimizedSentence: "Reading broadens a student's perspective.",
      reuseCount: 0
    }
  ]
};

describe("reviewEssayDraft", () => {
  it("injects same essay type memory before different essay type memory", async () => {
    const reviewer: LlmReviewer = {
      reviewEssay: vi.fn().mockResolvedValue(validReview)
    };

    await reviewEssayDraft({
      reviewer,
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "读书的重要性",
      content: "People should read more books.",
      memory
    });

    expect(reviewer.reviewEssay).toHaveBeenCalledWith({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "读书的重要性",
      content: "People should read more books.",
      memory: {
        preferences: [
          expect.objectContaining({ id: "preference-same" }),
          expect.objectContaining({ id: "preference-other" })
        ],
        errorPatterns: [
          expect.objectContaining({ id: "error-same" }),
          expect.objectContaining({ id: "error-other" })
        ],
        expressions: [
          expect.objectContaining({ id: "expression-same" }),
          expect.objectContaining({ id: "expression-other" })
        ]
      }
    });
  });

  it("rejects invalid reviewer output with the review result schema", async () => {
    const reviewer = {
      reviewEssay: vi.fn().mockResolvedValue({
        ...validReview,
        overallScore: 21
      })
    } satisfies LlmReviewer;

    await expect(
      reviewEssayDraft({
        reviewer,
        essayType: "ENGLISH_ONE_PICTURE",
        prompt: "读书的重要性",
        content: "People should read more books.",
        memory
      })
    ).rejects.toThrow();
  });
});

describe("saveReviewedEssay", () => {
  it("creates an essay with suggestions and upserts review error patterns", async () => {
    const createdEssay = {
      id: "essay-1",
      userId: "user-1",
      type: "ENGLISH_ONE_PICTURE",
      prompt: "读书的重要性",
      content: "People should read more books.",
      overallScore: 16,
      reviewSummary: "文章结构完整，表达清晰。",
      suggestions: validReview.suggestions
    };
    const tx = {
      essay: {
        create: vi.fn().mockResolvedValue(createdEssay)
      },
      errorPattern: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      ...tx,
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    const essay = await saveReviewedEssay({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "读书的重要性",
      content: "People should read more books.",
      review: validReview
    });

    expect(essay).toBe(createdEssay);
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(tx.essay.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "ENGLISH_ONE_PICTURE",
        prompt: "读书的重要性",
        content: "People should read more books.",
        overallScore: 16,
        reviewSummary: "文章结构完整，表达清晰。",
        suggestions: {
          create: [
            {
              originalSentence: "People should read more books.",
              suggestedSentence:
                "People can build stronger judgment by reading more books.",
              reason: "表达更具体。",
              preferenceLabel: "正式但自然",
              expressionIntent: "说明阅读价值",
              topic: "reading",
              profileExplanation: "符合用户偏好的正式表达。"
            }
          ]
        }
      },
      include: {
        suggestions: true
      }
    });
    expect(tx.errorPattern.upsert).toHaveBeenCalledWith({
      where: {
        userId_label_essayType: {
          userId: "user-1",
          label: "论据略泛",
          essayType: "ENGLISH_ONE_PICTURE"
        }
      },
      create: {
        userId: "user-1",
        label: "论据略泛",
        essayType: "ENGLISH_ONE_PICTURE",
        count: 1
      },
      update: {
        count: {
          increment: 1
        },
        deletedAt: null
      }
    });
  });

  it("uses a transaction client for essay and error pattern writes", async () => {
    const tx = {
      essay: {
        create: vi.fn().mockResolvedValue({ id: "essay-1" })
      },
      errorPattern: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      essay: {
        create: vi.fn().mockRejectedValue(new Error("root essay create should not be called"))
      },
      errorPattern: {
        upsert: vi.fn().mockRejectedValue(new Error("root upsert should not be called"))
      },
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await saveReviewedEssay({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "读书的重要性",
      content: "People should read more books.",
      review: validReview
    });

    expect(db.essay.create).not.toHaveBeenCalled();
    expect(db.errorPattern.upsert).not.toHaveBeenCalled();
    expect(tx.essay.create).toHaveBeenCalledOnce();
    expect(tx.errorPattern.upsert).toHaveBeenCalledOnce();
  });
});
